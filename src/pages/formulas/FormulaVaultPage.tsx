import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation, useParams, Link } from 'react-router-dom';
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
  AlertCircle,
  RotateCcw,
  Share2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  D1FormulaCategoryRow,
  D1FormulaChapterRow,
  D1FormulaItemRow,
  FORMULA_VAULT_ITEMS_SEED,
} from '../../constants/formulaVaultSeed';
import { NotFoundPage } from '../NotFoundPage';
import {
  fetchFormulaVaultOverview,
  fetchChapterFormulas,
  searchFormulaVault,
  toggleFormulaBookmark,
  fetchBookmarkedFormulas,
  submitFormulaReport,
  FormulaOfTheDayItem,
} from '../../services/formulaVaultService';
import { MathText } from '../../components/ui/MathText';
import { useEffectivePlan } from '../../hooks/useEffectivePlan';
import { useBodyScrollLock, safetyCleanupScrollLocks } from '../../utils/scrollLock';
import { AdSlot } from '@/components/AdSlot';
import { useAdsConfig } from '@/services/adsConfigService';

/**
 * Highlights all space-separated search tokens inside `text` (case-insensitive).
 */
function HighlightMatch({ text, query }: { text: string; query: string }) {
  const rawText = String(text || '');
  const tokens = String(query || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (tokens.length === 0 || !rawText) return <>{rawText}</>;

  const pattern = new RegExp(`(${tokens.join('|')})`, 'gi');
  const parts = rawText.split(pattern);
  const lowerTokens = new Set(
    String(query || '')
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
  );

  return (
    <>
      {parts.map((part, idx) =>
        lowerTokens.has(part.toLowerCase()) ? (
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
  return `${n} formula${n === 1 ? '' : 's'}`;
}

/**
 * Measures rendered KaTeX math width inside its formula box:
 * - If wider than the container, scales down smoothly (minimum scale 0.7).
 * - If it still overflows at 0.7 scale, allows horizontal scroll with a right-edge fade.
 */
const FitFormulaMath: React.FC<{ latex: string; className?: string }> = ({ latex, className }) => {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [needsScroll, setNeedsScroll] = useState(false);

  const measureAndFit = useCallback(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const availableWidth = Math.max(0, outer.clientWidth - 8);
    const naturalWidth = inner.scrollWidth;
    if (!availableWidth || !naturalWidth || naturalWidth <= availableWidth) {
      setScale(1);
      setNeedsScroll(false);
      return;
    }

    const ratio = availableWidth / naturalWidth;
    const clampedScale = Math.max(0.7, Math.min(1, Number(ratio.toFixed(3))));
    setScale(clampedScale);
    setNeedsScroll(naturalWidth * clampedScale > availableWidth + 2);
  }, []);

  useEffect(() => {
    measureAndFit();
    const outer = outerRef.current;
    if (!outer || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => measureAndFit());
    ro.observe(outer);
    return () => ro.disconnect();
  }, [latex, measureAndFit]);

  return (
    <div
      ref={outerRef}
      className={`formula-math-scroll relative w-full ${
        needsScroll ? 'formula-math-scroll--overflow justify-start' : 'justify-center'
      } ${className || ''}`}
    >
      <div
        ref={innerRef}
        style={{
          fontSize: scale < 1 ? `${Math.round(scale * 100)}%` : undefined,
          width: 'max-content',
          maxWidth: needsScroll ? 'none' : '100%',
        }}
        className="mx-auto transition-[font-size] duration-150"
      >
        <MathText text={`$$${latex}$$`} />
      </div>
    </div>
  );
};

type EnrichedFormulaItem = D1FormulaItemRow & {
  chapter_title?: string;
  chapter_no?: number;
  category_name?: string;
};

export const FormulaVaultPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { formulaId: routeFormulaId } = useParams<{ formulaId?: string }>();
  const { user, isGuest, isAdmin, isSuperAdmin } = useAuth();
  const { isUnlimited } = useEffectivePlan();

  const isSignedIn = Boolean(user && !isGuest);
  const isProOrAdmin = Boolean(isUnlimited || isAdmin || isSuperAdmin);
  const [formulaNotFound, setFormulaNotFound] = useState(false);

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

  // Selected subject ('all' or category.id) & open chapter (only ONE chapter open at a time)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [savedFormulasList, setSavedFormulasList] = useState<EnrichedFormulaItem[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  const [openChapterId, setOpenChapterId] = useState<string | null>(null);
  const [openChapterFormulas, setOpenChapterFormulas] = useState<D1FormulaItemRow[]>([]);
  const { config: adsConfig } = useAdsConfig();
  const formulaFeedEveryN = Math.max(2, adsConfig.slots.formula_feed?.everyN || 6);
  const [loadingChapterId, setLoadingChapterId] = useState<string | null>(null);

  // PDF generation state (Grand Line PDF design)
  const [downloadingPdfChapterId, setDownloadingPdfChapterId] = useState<string | null>(null);
  const [pdfErrorByChapterId, setPdfErrorByChapterId] = useState<Record<string, string>>({});

  // Search state (~150ms debounce, searches across ALL subjects)
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchMatchedFormulas, setSearchMatchedFormulas] = useState<EnrichedFormulaItem[]>([]);

  // Enlarged formula modal state
  const [enlargedFormula, setEnlargedFormula] = useState<{
    formula: D1FormulaItemRow;
    chapterTitle: string;
    chapterNo: number;
    categoryName: string;
    pool: D1FormulaItemRow[];
  } | null>(null);
  const [copiedType, setCopiedType] = useState<'latex' | 'plain' | 'share' | null>(null);

  // Report issue state inside enlarged view
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('incorrect_formula');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  // Refs for smooth auto-scrolling of subject pills and opened chapters
  const mobilePillRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const chapterCardRefs = useRef<Record<string, HTMLElement | null>>({});
  const mobileSearchInputRef = useRef<HTMLInputElement | null>(null);
  const desktopSearchInputRef = useRef<HTMLInputElement | null>(null);
  const enlargeModalBodyRef = useRef<HTMLDivElement | null>(null);

  // Lock body scroll when enlarge sheet/modal is open and guarantee cleanup
  useBodyScrollLock(Boolean(enlargedFormula), 'formula-enlarge-modal');

  useEffect(() => {
    if (!enlargedFormula) {
      safetyCleanupScrollLocks();
    } else if (enlargeModalBodyRef.current) {
      enlargeModalBodyRef.current.scrollTop = 0;
    }
  }, [enlargedFormula]);

  useEffect(() => {
    return () => {
      safetyCleanupScrollLocks();
    };
  }, [location.pathname]);

  const handleCloseEnlarged = useCallback(() => {
    setEnlargedFormula(null);
    setReportModalOpen(false);
    if (typeof window !== 'undefined') {
      const p = window.location.pathname.toLowerCase();
      const base = p.startsWith('/dashboard/formula-vault')
        ? '/dashboard/formula-vault'
        : p.startsWith('/dashboard/formulas')
        ? '/dashboard/formulas'
        : p.startsWith('/formula-vault')
        ? '/formula-vault'
        : '/formulas';
      if (window.location.pathname !== base) {
        window.history.replaceState(null, '', base);
      }
    }
    window.setTimeout(() => safetyCleanupScrollLocks(), 0);
  }, []);

  // Sync browser URL when an enlarged formula is open
  useEffect(() => {
    if (typeof window === 'undefined' || !enlargedFormula) return;
    const p = window.location.pathname.toLowerCase();
    const base = p.startsWith('/dashboard/formula-vault')
      ? '/dashboard/formula-vault'
      : p.startsWith('/dashboard/formulas')
      ? '/dashboard/formulas'
      : p.startsWith('/formula-vault')
      ? '/formula-vault'
      : '/formulas';
    const nextUrl = `${base}/${encodeURIComponent(enlargedFormula.formula.id)}`;
    if (window.location.pathname !== nextUrl) {
      window.history.replaceState(null, '', nextUrl);
    }
  }, [enlargedFormula]);

  // Load initial overview + resolve deep-linked formula or chapter if present
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingOverview(true);
      setFormulaNotFound(false);
      const data = await fetchFormulaVaultOverview();
      if (!mounted) return;
      setCategories(data.categories);
      setChapters(data.chapters);
      setFormulaOfTheDay(data.formulaOfTheDay);
      setBookmarkedIds(new Set(data.bookmarkedIds));

      const params =
        typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
      const requestedFormulaId = (routeFormulaId || params.get('formula') || '').trim();
      const requestedChapterId = (params.get('chapter') || '').trim();

      if (requestedFormulaId) {
        const lowerId = requestedFormulaId.toLowerCase();
        // Check if requestedFormulaId is actually a chapter ID or chapter slug
        const matchedChapter = data.chapters.find(
          (c) =>
            c.id.toLowerCase() === lowerId ||
            (c.slug && c.slug.toLowerCase() === lowerId)
        );
        if (matchedChapter) {
          setSelectedCategoryId(matchedChapter.category_id);
          setOpenChapterId(matchedChapter.id);
          setLoadingOverview(false);
          return;
        }

        // Otherwise resolve formula by ID or title slug
        let matchedFormula: D1FormulaItemRow | undefined = FORMULA_VAULT_ITEMS_SEED.find(
          (f) =>
            f.id.toLowerCase() === lowerId ||
            f.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') === lowerId
        );
        if (!matchedFormula) {
          try {
            const searchRes = await searchFormulaVault(requestedFormulaId);
            matchedFormula = searchRes.formulas.find(
              (f) =>
                f.id.toLowerCase() === lowerId ||
                f.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') === lowerId
            );
          } catch {
            // Ignore search error
          }
        }

        if (!mounted) return;
        if (!matchedFormula) {
          setFormulaNotFound(true);
          setLoadingOverview(false);
          return;
        }

        setSelectedCategoryId(matchedFormula.category_id);
        setOpenChapterId(matchedFormula.chapter_id);
        let pool: D1FormulaItemRow[] = [matchedFormula];
        try {
          const chRes = await fetchChapterFormulas(matchedFormula.chapter_id);
          if (chRes.formulas.length > 0) {
            pool = chRes.formulas;
          }
        } catch {
          // Fallback to single-item pool
        }
        if (!mounted) return;
        const ch = data.chapters.find((c) => c.id === matchedFormula!.chapter_id);
        const cat = data.categories.find((c) => c.id === matchedFormula!.category_id);
        setEnlargedFormula({
          formula: matchedFormula,
          chapterTitle: ch?.title || 'Chapter',
          chapterNo: ch?.chapter_no || 1,
          categoryName: cat?.name || 'Formula Library',
          pool,
        });
        setLoadingOverview(false);
        return;
      }

      if (requestedChapterId) {
        const lowerCh = requestedChapterId.toLowerCase();
        const matchedCh = data.chapters.find(
          (c) =>
            c.id.toLowerCase() === lowerCh ||
            (c.slug && c.slug.toLowerCase() === lowerCh)
        );
        if (!matchedCh) {
          setFormulaNotFound(true);
          setLoadingOverview(false);
          return;
        }
        setSelectedCategoryId(matchedCh.category_id);
        setOpenChapterId(matchedCh.id);
        setLoadingOverview(false);
        return;
      }

      if (data.categories.length > 0) {
        const firstCatId = data.categories[0].id;
        setSelectedCategoryId((prev) => prev || firstCatId);
        const firstCh = data.chapters
          .filter((c) => c.category_id === firstCatId)
          .sort(
            (a, b) =>
              Number(a.chapter_no || 0) - Number(b.chapter_no || 0) ||
              Number(a.sort_order || 0) - Number(b.sort_order || 0)
          )[0];
        if (firstCh) {
          setOpenChapterId((prev) => prev || firstCh.id);
        }
      }
      setLoadingOverview(false);
    })();
    return () => {
      mounted = false;
    };
  }, [user?.uid, routeFormulaId]);

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

  // Debounce search query (~150ms)
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(searchQuery.replace(/\s+/g, ' ').trim());
    }, 150);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  // Execute search across ALL subjects when debouncedQuery changes
  useEffect(() => {
    if (!debouncedQuery) {
      setSearchMatchedFormulas([]);
      setSearching(false);
      return;
    }
    let mounted = true;
    setSearching(true);
    searchFormulaVault(debouncedQuery)
      .then((res) => {
        if (!mounted) return;
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

  // Total formula count across all subjects for the "All" subject pill
  const totalFormulasAllSubjects = useMemo(
    () => categories.reduce((sum, cat) => sum + Number(cat.formula_count || 0), 0),
    [categories]
  );

  // Dynamic subject pills list: "All" + every subject in categories
  const subjectPills = useMemo(() => {
    const allPill = {
      id: 'all',
      name: 'All',
      formula_count: totalFormulasAllSubjects,
      chapter_count: chapters.length,
      description: 'Complete numbered formula sheets across every subject',
    };
    return [allPill, ...categories];
  }, [categories, chapters.length, totalFormulasAllSubjects]);

  const activeCategory = useMemo(() => {
    if (selectedCategoryId === 'all') return null;
    return categories.find((c) => c.id === selectedCategoryId) || categories[0] || null;
  }, [categories, selectedCategoryId]);

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const visibleChapters = useMemo(() => {
    if (selectedCategoryId === 'all') {
      return [...chapters].sort((a, b) => {
        const catA = categoryMap.get(a.category_id)?.sort_order ?? 999;
        const catB = categoryMap.get(b.category_id)?.sort_order ?? 999;
        if (catA !== catB) return catA - catB;
        return (
          Number(a.chapter_no || 0) - Number(b.chapter_no || 0) ||
          Number(a.sort_order || 0) - Number(b.sort_order || 0)
        );
      });
    }
    const targetCatId = activeCategory?.id || '';
    return chapters
      .filter((ch) => ch.category_id === targetCatId)
      .sort(
        (a, b) =>
          Number(a.chapter_no || 0) - Number(b.chapter_no || 0) ||
          Number(a.sort_order || 0) - Number(b.sort_order || 0)
      );
  }, [chapters, selectedCategoryId, activeCategory, categoryMap]);

  // Combine search results with Saved filter if Saved is active, and group by Subject and Chapter
  const filteredSearchFormulas = useMemo(() => {
    if (!showSavedOnly) return searchMatchedFormulas;
    return searchMatchedFormulas.filter((item) => bookmarkedIds.has(item.id));
  }, [searchMatchedFormulas, showSavedOnly, bookmarkedIds]);

  const groupedSearchResults = useMemo(() => {
    const groups: Array<{
      key: string;
      subjectName: string;
      chapterId: string;
      chapterNo: number;
      chapterTitle: string;
      formulas: EnrichedFormulaItem[];
    }> = [];
    const groupMap = new Map<string, (typeof groups)[number]>();

    for (const item of filteredSearchFormulas) {
      const ch = chapters.find((c) => c.id === item.chapter_id);
      const cat = categories.find((c) => c.id === item.category_id);
      const subjectName = item.category_name || cat?.name || 'Formula Sheet';
      const chapterNo = item.chapter_no ?? ch?.chapter_no ?? 1;
      const chapterTitle = item.chapter_title || ch?.title || 'Chapter';
      const key = `${item.category_id}::${item.chapter_id}`;

      let existing = groupMap.get(key);
      if (!existing) {
        existing = {
          key,
          subjectName,
          chapterId: item.chapter_id,
          chapterNo,
          chapterTitle,
          formulas: [],
        };
        groupMap.set(key, existing);
        groups.push(existing);
      }
      existing.formulas.push(item);
    }

    return groups;
  }, [filteredSearchFormulas, chapters, categories]);

  const handleSelectSubject = useCallback(
    (subjectId: string) => {
      setShowSavedOnly(false);
      setSelectedCategoryId(subjectId);

      // Scroll selected mobile subject pill smoothly into view
      const pillBtn = mobilePillRefs.current[subjectId];
      if (pillBtn) {
        pillBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }

      const targetChapters =
        subjectId === 'all'
          ? chapters
          : chapters.filter((c) => c.category_id === subjectId);
      const firstCh = [...targetChapters].sort(
        (a, b) =>
          Number(a.chapter_no || 0) - Number(b.chapter_no || 0) ||
          Number(a.sort_order || 0) - Number(b.sort_order || 0)
      )[0];
      setOpenChapterId(firstCh ? firstCh.id : null);
    },
    [chapters]
  );

  const handleToggleChapter = useCallback((chapterId: string) => {
    setOpenChapterId((prev) => {
      const next = prev === chapterId ? null : chapterId;
      if (next) {
        window.setTimeout(() => {
          const el = chapterCardRefs.current[next];
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 80);
      }
      return next;
    });
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setDebouncedQuery('');
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
        categoryName: meta?.categoryName || cat?.name || 'Formula Library',
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
        handleCloseEnlarged();
      } else if (e.key === 'ArrowLeft') {
        handlePrevNextFormula(-1);
      } else if (e.key === 'ArrowRight') {
        handlePrevNextFormula(1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enlargedFormula, handlePrevNextFormula, handleCloseEnlarged]);

  const handleCopyText = async (text: string, type: 'latex' | 'plain') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      showToast(
        type === 'latex' ? 'LaTeX copied to clipboard' : 'Plain text copied to clipboard',
        'success'
      );
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
        res.bookmarked ? 'Saved to your favourites' : 'Removed from favourites',
        'success'
      );
    } catch (err: any) {
      showToast(err?.message || 'Unable to update bookmark', 'error');
    }
  };

  /**
   * Generates and downloads the Formula Sheet PDF using the exact Grand Line PDF design.
   * Preserves Premium gating, prevents double taps, and provides an inline retry option on failure.
   */
  const handleDownloadChapterPdf = async (chapter: D1FormulaChapterRow, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (downloadingPdfChapterId) return;

    if (!isSignedIn) {
      showToast('Sign in and upgrade to Boardly Pro to download chapter PDFs.', 'info');
      return;
    }
    if (!isProOrAdmin) {
      showToast('Chapter PDF sheets are a Boardly Pro feature.', 'info');
      navigate('/dashboard/plan');
      return;
    }

    setDownloadingPdfChapterId(chapter.id);
    setPdfErrorByChapterId((prev) => {
      const next = { ...prev };
      delete next[chapter.id];
      return next;
    });

    try {
      let formulasToExport =
        openChapterId === chapter.id && openChapterFormulas.length > 0
          ? openChapterFormulas
          : [];

      if (formulasToExport.length === 0) {
        const res = await fetchChapterFormulas(chapter.id);
        formulasToExport = res.formulas;
      }

      if (!formulasToExport || formulasToExport.length === 0) {
        throw new Error('No formulas found in this chapter to generate a PDF.');
      }

      const subjectObj = categories.find((c) => c.id === chapter.category_id);
      const subjectLabel = subjectObj?.name || activeCategory?.name || 'Formula Library';
      const studentDisplay =
        user?.displayName || user?.email?.split('@')[0] || 'Boardly Pro Student';

      const { exportFormulaSheetToPdf } = await import('../../utils/formulaPdfExporter');
      await exportFormulaSheetToPdf({
        chapter,
        subjectName: subjectLabel,
        formulas: formulasToExport,
        studentName: studentDisplay,
      });

      showToast(`Downloaded "${chapter.chapter_no} ${chapter.title}" PDF`, 'success');
    } catch (err: any) {
      const msg = err?.message || 'Could not generate PDF. Please try again.';
      setPdfErrorByChapterId((prev) => ({
        ...prev,
        [chapter.id]: msg,
      }));
      showToast(msg, 'error');
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

  /**
   * Reusable Formula Card component matching the Apple x Nothing design language:
   * - Round numbered badge (dot-matrix number in red)
   * - Title wrapping up to 2 lines (never cut off to 1 line)
   * - 44px bookmark button (stops propagation)
   * - Centered formula box with dynamic shrink-to-fit (min 0.7) and right-edge fade scroll fallback
   * - Note
   */
  const renderFormulaCard = (
    formula: EnrichedFormulaItem,
    pool: D1FormulaItemRow[],
    meta: { chapterTitle: string; chapterNo: number; categoryName: string },
    options?: { showSubjectChapterLabel?: boolean; highlightQuery?: string }
  ) => {
    const isSaved = bookmarkedIds.has(formula.id);
    const hlQuery = options?.highlightQuery || '';

    return (
      <div
        key={formula.id}
        onClick={() => handleOpenEnlarged(formula, pool, meta)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleOpenEnlarged(formula, pool, meta);
          }
        }}
        className="group relative flex flex-col justify-between rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4 transition-all duration-150 hover:border-[var(--accent)] active:scale-[0.98] cursor-pointer"
      >
        <div>
          {options?.showSubjectChapterLabel && (
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-secondary)]">
              <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-0.5">
                {meta.categoryName} · {meta.chapterNo} {meta.chapterTitle}
              </span>
            </div>
          )}

          {/* Top Row: Round Dot-Matrix Number Badge + 2-Line Wrapping Title + 44px Bookmark Button */}
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-start gap-2.5 min-w-0 pt-1">
              <span className="inline-flex h-8 min-w-[32px] shrink-0 items-center justify-center rounded-full border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-2 font-[var(--font-dot)] text-xs font-bold text-[var(--accent)]">
                #{formula.formula_no}
              </span>
              <h4 className="text-sm font-semibold leading-snug text-[var(--text)] line-clamp-2 break-words">
                {hlQuery ? (
                  <HighlightMatch
                    text={formula.title || `Formula #${formula.formula_no}`}
                    query={hlQuery}
                  />
                ) : (
                  formula.title || `Formula #${formula.formula_no}`
                )}
              </h4>
            </div>

            <button
              type="button"
              onClick={(e) => handleBookmarkClick(formula.id, e)}
              aria-label={isSaved ? 'Remove bookmark' : 'Bookmark formula'}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-all duration-150 active:scale-[0.95] ${
                isSaved
                  ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                  : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text)]'
              }`}
            >
              <Bookmark className="h-4 w-4" fill={isSaved ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Centered Shrink-to-Fit (min 0.7) / Horizontally-Scrollable Formula Container */}
          <FitFormulaMath
            latex={formula.formula_latex}
            className="my-3 flex min-h-[64px] items-center rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-3 text-center text-sm sm:text-base text-[var(--text)]"
          />
        </div>

        {/* Formula Note */}
        {formula.note && (
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)] line-clamp-2">
            {hlQuery ? <HighlightMatch text={formula.note} query={hlQuery} /> : formula.note}
          </p>
        )}
      </div>
    );
  };

  if (formulaNotFound) {
    return <NotFoundPage />;
  }

  return (
    <div className="formula-library-page min-h-screen text-[var(--text)] pb-36">
      {/* Main Responsive Container: up to 880px on tablet, up to 1200px on laptop/PC */}
      <div className="mx-auto w-full max-w-[880px] lg:max-w-[1200px] px-4 pt-4 sm:px-6">
        {/* Top Header Card */}
        <header className="mb-4 rounded-[26px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <button
                type="button"
                onClick={() => {
                  if (window.history.length > 1) navigate(-1);
                  else navigate('/dashboard');
                }}
                aria-label="Go back"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] transition-transform duration-150 active:scale-[0.98] hover:border-[var(--accent)]"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="font-[var(--font-dot)] text-[clamp(1.25rem,3.4vw,1.75rem)] font-bold leading-tight tracking-tight text-[var(--text)]">
                    Formula Library
                  </h1>
                  <span className="inline-flex items-center rounded-full border border-[var(--accent)] bg-[var(--accent-soft)] px-2.5 py-0.5 font-[var(--font-dot)] text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]">
                    SHEET LIBRARY
                  </span>
                </div>
                <p className="mt-0.5 text-xs sm:text-sm text-[var(--text-secondary)]">
                  Complete numbered formula sheets
                </p>
              </div>
            </div>

            {/* Saved Button on Mobile & Tablet (on Laptop/PC it lives in the left sidebar) */}
            <button
              type="button"
              onClick={() => {
                if (!isSignedIn) {
                  showToast('Sign in to save and view favourite formulas.', 'info');
                  return;
                }
                setShowSavedOnly((prev) => !prev);
              }}
              className={`lg:hidden flex min-h-[44px] shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-150 active:scale-[0.98] ${
                showSavedOnly
                  ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--text-on-accent)]'
                  : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] hover:border-[var(--accent)]'
              }`}
            >
              <Bookmark className="h-4 w-4" fill={showSavedOnly ? 'currentColor' : 'none'} />
              <span>Saved</span>
              {bookmarkedIds.size > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 font-[var(--font-dot)] text-[11px] ${
                    showSavedOnly
                      ? 'bg-[var(--surface)]/20 text-[var(--text-on-accent)]'
                      : 'bg-[var(--surface)] text-[var(--text)]'
                  }`}
                >
                  {bookmarkedIds.size}
                </span>
              )}
            </button>
          </div>

          {/* Mobile & Tablet Search Pill + Horizontal Subject Pill Row (< 1024px) */}
          <div className="mt-4 space-y-3 lg:hidden">
            <div className="formula-search-pill">
              <Search className="h-4 w-4 shrink-0 text-[var(--text-secondary)]" />
              <input
                ref={mobileSearchInputRef}
                type="search"
                enterKeyHint="search"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search formulas, chapters or subjects"
                aria-label="Search formulas, chapters or subjects"
                className="formula-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    handleClearSearch();
                    mobileSearchInputRef.current?.focus();
                  }}
                  aria-label="Clear search"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text)]"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Horizontal Subject Pills Row (Subjects only, showing formula count) */}
            <div className="formula-subject-pills-row" role="tablist" aria-label="Subjects">
              {loadingOverview
                ? Array.from({ length: 6 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="h-11 w-32 shrink-0 animate-pulse rounded-full border border-[var(--border)] bg-[var(--surface-2)]"
                    />
                  ))
                : subjectPills.map((sub) => {
                    const isSelected = !showSavedOnly && selectedCategoryId === sub.id;
                    return (
                      <button
                        key={sub.id}
                        ref={(el) => {
                          mobilePillRefs.current[sub.id] = el;
                        }}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        onClick={() => handleSelectSubject(sub.id)}
                        className={`snap-start min-h-[44px] shrink-0 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-150 active:scale-[0.98] ${
                          isSelected
                            ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--text-on-accent)]'
                            : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] hover:border-[var(--accent)]'
                        }`}
                      >
                        <span className="whitespace-nowrap">{sub.name}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 font-[var(--font-dot)] text-[11px] ${
                            isSelected
                              ? 'bg-[var(--surface)]/20 text-[var(--text-on-accent)]'
                              : 'bg-[var(--surface)] text-[var(--text-secondary)]'
                          }`}
                        >
                          {sub.formula_count}
                        </span>
                      </button>
                    );
                  })}
            </div>
          </div>
        </header>

        {/* Toast Feedback Banner */}
        {toastBanner && (
          <div
            role="status"
            className="mb-4 flex items-center justify-between gap-3 rounded-[20px] border border-[var(--accent)] bg-[var(--surface)] px-4 py-3 text-xs font-semibold text-[var(--text)]"
          >
            <span>{toastBanner.message}</span>
            <button
              type="button"
              onClick={() => setToastBanner(null)}
              aria-label="Dismiss notification"
              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-secondary)] hover:text-[var(--text)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Guest Mode Banner */}
        {!isSignedIn && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-[22px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-xs text-[var(--text-secondary)]">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
              <span className="font-medium text-[var(--text)]">
                Guest mode: sign in to save favourites.
              </span>
            </div>
            <Link
              to="/login"
              className="inline-flex min-h-[36px] items-center rounded-full border border-[var(--accent)] bg-[var(--accent-soft)] px-3.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--text-on-accent)] transition-colors"
            >
              Sign in
            </Link>
          </div>
        )}

        {/* Two-Column Layout on Laptop/PC (280px sticky sidebar + main content) */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-6 items-start">
          {/* Sticky Left Sidebar on Laptop/PC (>= 1024px) */}
          <aside className="hidden lg:flex lg:flex-col lg:gap-3.5 sticky top-6 rounded-[26px] border border-[var(--border)] bg-[var(--surface)] p-4">
            {/* Desktop Search Pill */}
            <div className="formula-search-pill">
              <Search className="h-4 w-4 shrink-0 text-[var(--text-secondary)]" />
              <input
                ref={desktopSearchInputRef}
                type="search"
                enterKeyHint="search"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search formulas, chapters or subjects"
                aria-label="Search formulas, chapters or subjects"
                className="formula-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    handleClearSearch();
                    desktopSearchInputRef.current?.focus();
                  }}
                  aria-label="Clear search"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text)]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Desktop Saved Button */}
            <button
              type="button"
              onClick={() => {
                if (!isSignedIn) {
                  showToast('Sign in to save and view favourite formulas.', 'info');
                  return;
                }
                setShowSavedOnly((prev) => !prev);
              }}
              className={`flex min-h-[44px] w-full items-center justify-between gap-2 rounded-full border px-4 py-2.5 text-xs font-semibold transition-all duration-150 active:scale-[0.98] ${
                showSavedOnly
                  ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--text-on-accent)]'
                  : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] hover:border-[var(--accent)]'
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <Bookmark className="h-4 w-4" fill={showSavedOnly ? 'currentColor' : 'none'} />
                <span>Saved</span>
              </span>
              <span
                className={`rounded-full px-2 py-0.5 font-[var(--font-dot)] text-xs ${
                  showSavedOnly
                    ? 'bg-[var(--surface)]/20 text-[var(--text-on-accent)]'
                    : 'bg-[var(--surface)] text-[var(--text-secondary)]'
                }`}
              >
                {bookmarkedIds.size}
              </span>
            </button>

            <div className="h-px w-full bg-[var(--border)]" />

            {/* Vertical List of Subjects with Formula Counts */}
            <div className="px-1 flex items-center justify-between">
              <span className="font-[var(--font-dot)] text-[11px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                Subjects
              </span>
              <span className="font-[var(--font-dot)] text-[11px] text-[var(--text-secondary)]">
                {categories.length}
              </span>
            </div>

            <div className="space-y-1.5" role="tablist" aria-label="Subjects">
              {loadingOverview
                ? Array.from({ length: 8 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="h-11 w-full animate-pulse rounded-2xl bg-[var(--surface-2)]"
                    />
                  ))
                : subjectPills.map((sub) => {
                    const isSelected = !showSavedOnly && selectedCategoryId === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        onClick={() => handleSelectSubject(sub.id)}
                        className={`flex min-h-[44px] w-full items-center justify-between gap-2.5 rounded-2xl border px-3.5 py-2.5 text-left text-xs font-semibold transition-all duration-150 active:scale-[0.98] ${
                          isSelected
                            ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--text-on-accent)]'
                            : 'border-transparent bg-transparent text-[var(--text)] hover:border-[var(--border)] hover:bg-[var(--surface-2)]'
                        }`}
                      >
                        <span className="leading-snug break-words">{sub.name}</span>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 font-[var(--font-dot)] text-xs ${
                            isSelected
                              ? 'bg-[var(--surface)]/20 text-[var(--text-on-accent)]'
                              : 'bg-[var(--surface-2)] text-[var(--text-secondary)]'
                          }`}
                        >
                          {sub.formula_count}
                        </span>
                      </button>
                    );
                  })}
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="min-w-0 space-y-4">
            {/* Formula of the Day Card (shown when not searching and not in Saved-only view) */}
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
                className="cursor-pointer rounded-[26px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 transition-all duration-150 hover:border-[var(--accent)] active:scale-[0.99]"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-3 py-1 font-[var(--font-dot)] text-[10px] font-bold uppercase tracking-wider text-[var(--accent)]">
                      <Sparkles className="h-3 w-3" />
                      Formula of the Day
                    </span>
                    <span className="text-xs font-medium text-[var(--text-secondary)]">
                      {formulaOfTheDay.category_name} ·{' '}
                      {String(formulaOfTheDay.chapter_no).padStart(2, '0')}{' '}
                      {formulaOfTheDay.chapter_title}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--text-secondary)]">
                    <Maximize2 className="h-3.5 w-3.5 text-[var(--accent)]" />
                    Tap to enlarge
                  </span>
                </div>

                {formulaOfTheDay.title && (
                  <p className="mb-2 text-sm font-semibold text-[var(--text)]">
                    {formulaOfTheDay.title}
                  </p>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3.5">
                  <FitFormulaMath
                    latex={formulaOfTheDay.formula_latex}
                    className="flex items-center text-sm sm:text-base font-medium text-[var(--text)]"
                  />
                  {formulaOfTheDay.note && (
                    <p className="text-xs leading-relaxed text-[var(--text-secondary)] sm:max-w-xs sm:text-right">
                      {formulaOfTheDay.note}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Case 1: Active Search Across All Subjects (combined with Saved filter when active) */}
            {debouncedQuery ? (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-[22px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5">
                  <div className="min-w-0">
                    <h2 className="font-[var(--font-dot)] text-base sm:text-lg font-bold text-[var(--text)]">
                      Search results for &ldquo;{debouncedQuery}&rdquo;
                    </h2>
                    {showSavedOnly && (
                      <p className="text-xs text-[var(--text-secondary)]">
                        Filtered to your saved formulas
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 font-[var(--font-dot)] text-xs font-bold text-[var(--accent)]">
                      {filteredSearchFormulas.length} formula
                      {filteredSearchFormulas.length === 1 ? '' : 's'} found
                    </span>
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="min-h-[38px] rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-1.5 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)] transition-transform active:scale-[0.98]"
                    >
                      Clear search
                    </button>
                  </div>
                </div>

                {searching ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="min-h-[168px] animate-pulse rounded-[24px] border border-[var(--border)] bg-[var(--surface)]"
                      />
                    ))}
                  </div>
                ) : groupedSearchResults.length === 0 ? (
                  <div className="rounded-[26px] border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
                    <BookOpen className="mx-auto h-9 w-9 text-[var(--text-secondary)] mb-2.5" />
                    <p className="font-[var(--font-dot)] text-base font-bold text-[var(--text)]">
                      No formulas match
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-md mx-auto">
                      No formulas matched &ldquo;{debouncedQuery}&rdquo;
                      {showSavedOnly ? ' in your saved formulas' : ' across any subject'}.
                    </p>
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-full border border-[var(--accent)] bg-[var(--accent)] px-5 py-2 text-xs font-semibold text-[var(--text-on-accent)] transition-transform duration-150 active:scale-[0.98]"
                    >
                      Clear search
                    </button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {groupedSearchResults.map((group) => (
                      <section
                        key={group.key}
                        className="rounded-[26px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 space-y-3.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-3 py-1 font-[var(--font-dot)] text-xs font-bold text-[var(--accent)]">
                              <HighlightMatch text={group.subjectName} query={debouncedQuery} />
                            </span>
                            <span className="font-[var(--font-dot)] text-sm sm:text-base font-bold text-[var(--text)]">
                              {group.chapterNo}{' '}
                              <HighlightMatch text={group.chapterTitle} query={debouncedQuery} />
                            </span>
                          </div>
                          <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 font-[var(--font-dot)] text-xs text-[var(--text-secondary)]">
                            {group.formulas.length} formula
                            {group.formulas.length === 1 ? '' : 's'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                          {group.formulas.map((item) =>
                            renderFormulaCard(
                              item,
                              filteredSearchFormulas,
                              {
                                chapterTitle: group.chapterTitle,
                                chapterNo: group.chapterNo,
                                categoryName: group.subjectName,
                              },
                              {
                                showSubjectChapterLabel: true,
                                highlightQuery: debouncedQuery,
                              }
                            )
                          )}
                        </div>
                      </section>
                    ))}
                  </div>
                )}
              </div>
            ) : showSavedOnly ? (
              /* Case 2: Saved Favourites View */
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-[24px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5">
                  <div>
                    <h2 className="font-[var(--font-dot)] text-base sm:text-lg font-bold text-[var(--text)]">
                      Saved Formulas
                    </h2>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Your bookmarked formulas across all subjects
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSavedOnly(false)}
                    className="min-h-[44px] rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)] transition-transform duration-150 active:scale-[0.98]"
                  >
                    Back to sheets
                  </button>
                </div>

                {loadingSaved ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="min-h-[168px] animate-pulse rounded-[24px] border border-[var(--border)] bg-[var(--surface)]"
                      />
                    ))}
                  </div>
                ) : savedFormulasList.length === 0 ? (
                  <div className="rounded-[26px] border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
                    <Bookmark className="mx-auto h-9 w-9 text-[var(--text-secondary)] mb-2.5" />
                    <p className="font-[var(--font-dot)] text-base font-bold text-[var(--text)]">
                      No saved formulas yet
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      Tap the bookmark icon on any formula card to save it here for fast revision.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                    {savedFormulasList.map((item) =>
                      renderFormulaCard(
                        item,
                        savedFormulasList,
                        {
                          chapterTitle: item.chapter_title || 'Chapter',
                          chapterNo: item.chapter_no || 1,
                          categoryName: item.category_name || 'Formula Sheet',
                        },
                        { showSubjectChapterLabel: true }
                      )
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Case 3: Standard Subject > Collapsible Chapter Cards > Numbered Formula Cards */
              <div className="space-y-3.5">
                {/* Active Subject Heading Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                  <div>
                    <h2 className="font-[var(--font-dot)] text-lg sm:text-xl font-bold text-[var(--text)]">
                      {selectedCategoryId === 'all'
                        ? 'All Subjects'
                        : activeCategory?.name || 'Subject'}
                    </h2>
                    {selectedCategoryId !== 'all' && activeCategory?.description && (
                      <p className="text-xs text-[var(--text-secondary)]">
                        {activeCategory.description}
                      </p>
                    )}
                  </div>
                  <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-1.5 font-[var(--font-dot)] text-xs text-[var(--text-secondary)]">
                    {visibleChapters.length} chapter{visibleChapters.length === 1 ? '' : 's'} ·{' '}
                    {selectedCategoryId === 'all'
                      ? totalFormulasAllSubjects
                      : activeCategory?.formula_count || 0}{' '}
                    formulas
                  </span>
                </div>

                {loadingOverview ? (
                  <div className="space-y-3.5">
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="min-h-[84px] animate-pulse rounded-[26px] border border-[var(--border)] bg-[var(--surface)]"
                      />
                    ))}
                  </div>
                ) : visibleChapters.length === 0 ? (
                  <div className="rounded-[26px] border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
                    <p className="font-[var(--font-dot)] text-base font-bold text-[var(--text)]">
                      No chapters in this subject yet
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      Select another subject to view its formula sheets.
                    </p>
                  </div>
                ) : (
                  visibleChapters.map((chapter) => {
                    const isOpen = openChapterId === chapter.id;
                    const isLoadingThisChapter = loadingChapterId === chapter.id;
                    const chapterSubject = categoryMap.get(chapter.category_id);
                    const pdfError = pdfErrorByChapterId[chapter.id];
                    const liveFormulaCount =
                      isOpen && !isLoadingThisChapter
                        ? openChapterFormulas.length
                        : Number(chapter.formula_count || 0);

                    return (
                      <section
                        key={chapter.id}
                        ref={(el) => {
                          chapterCardRefs.current[chapter.id] = el;
                        }}
                        className={`scroll-mt-24 rounded-[26px] border transition-colors overflow-hidden ${
                          isOpen
                            ? 'border-[var(--accent)] bg-[var(--surface)]'
                            : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]/60'
                        }`}
                      >
                        {/* Collapsible Chapter Header Row */}
                        <button
                          type="button"
                          onClick={() => handleToggleChapter(chapter.id)}
                          aria-expanded={isOpen}
                          className="w-full flex items-center justify-between gap-3 px-4 py-4 sm:px-5 text-left transition-transform duration-150 active:scale-[0.995]"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div
                              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border font-[var(--font-dot)] text-base font-bold transition-colors ${
                                isOpen
                                  ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--text-on-accent)]'
                                  : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]'
                              }`}
                            >
                              {String(chapter.chapter_no).padStart(2, '0')}
                            </div>

                            <div className="min-w-0">
                              {selectedCategoryId === 'all' && chapterSubject && (
                                <span className="mb-0.5 inline-block text-[11px] font-semibold text-[var(--accent)]">
                                  {chapterSubject.name}
                                </span>
                              )}
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-[var(--font-dot)] text-base sm:text-lg font-bold text-[var(--text)] break-words">
                                  {chapter.chapter_no} {chapter.title}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 font-[var(--font-dot)] text-xs font-bold text-[var(--text-secondary)]">
                              {formatFormulaCountBadge(liveFormulaCount)}
                            </span>
                            <span
                              className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                                isOpen
                                  ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                                  : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-secondary)]'
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
                          <div className="border-t border-[var(--border)] bg-[var(--surface-2)]/50 px-4 py-4 sm:px-5">
                            {/* Action Sub-bar: "Pick a formula to enlarge it" + "Download PDF (Premium)" */}
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5">
                              <span className="text-xs font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
                                <Maximize2 className="h-3.5 w-3.5 text-[var(--accent)]" />
                                Pick a formula to enlarge it
                              </span>

                              <button
                                type="button"
                                onClick={(e) => handleDownloadChapterPdf(chapter, e)}
                                disabled={downloadingPdfChapterId === chapter.id}
                                className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--accent)] bg-[var(--accent-soft)] px-4 py-2 text-xs font-bold text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--text-on-accent)] transition-all duration-150 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
                              >
                                {isProOrAdmin ? (
                                  <Download className="h-4 w-4" />
                                ) : (
                                  <Lock className="h-4 w-4" />
                                )}
                                <span>
                                  {downloadingPdfChapterId === chapter.id
                                    ? 'Preparing PDF...'
                                    : 'Download PDF (Premium)'}
                                </span>
                              </button>
                            </div>

                            {/* Inline PDF Error State with Retry Button */}
                            {pdfError && (
                              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--accent)] bg-[var(--surface)] px-4 py-3 text-xs text-[var(--text)]">
                                <div className="flex items-center gap-2">
                                  <AlertCircle className="h-4 w-4 shrink-0 text-[var(--accent)]" />
                                  <span>{pdfError}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => handleDownloadChapterPdf(chapter, e)}
                                  disabled={downloadingPdfChapterId === chapter.id}
                                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-[var(--accent)] bg-[var(--accent)] px-3.5 py-1.5 text-xs font-semibold text-[var(--text-on-accent)] transition-transform active:scale-[0.98]"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                  <span>Retry</span>
                                </button>
                              </div>
                            )}

                            {/* Formulas Grid: 1 col phone, 2 cols tablet, 2-3 cols laptop/PC */}
                            {isLoadingThisChapter ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                                {Array.from({ length: 6 }).map((_, idx) => (
                                  <div
                                    key={idx}
                                    className="min-h-[168px] animate-pulse rounded-[24px] border border-[var(--border)] bg-[var(--surface)]"
                                  />
                                ))}
                              </div>
                            ) : openChapterFormulas.length === 0 ? (
                              <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-6 text-center text-xs text-[var(--text-secondary)]">
                                No formulas published in this chapter yet.
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                                {openChapterFormulas.map((formula, fIdx) => (
                                  <React.Fragment key={formula.id}>
                                    {renderFormulaCard(formula, openChapterFormulas, {
                                      chapterTitle: chapter.title,
                                      chapterNo: chapter.chapter_no,
                                      categoryName:
                                        chapterSubject?.name ||
                                        activeCategory?.name ||
                                        'Formula Library',
                                    })}
                                    {(fIdx + 1) % formulaFeedEveryN === 0 && (
                                      <AdSlot
                                        slotId="formula_feed"
                                        instanceKey={`formula-${chapter.id}-${fIdx}`}
                                        wrapperClassName="col-span-full my-5 sm:my-6"
                                      />
                                    )}
                                  </React.Fragment>
                                ))}
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

      {/* Enlarged Formula Modal / Bottom Sheet rendered via Top-Level Portal above Header & Bottom Nav */}
      {enlargedFormula &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            data-fullscreen-modal="true"
            role="dialog"
            aria-modal="true"
            aria-label={`Formula #${enlargedFormula.formula.formula_no}`}
            className="formula-enlarge-portal formula-modal-backdrop fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={handleCloseEnlarged}
          >
            <div
              ref={enlargeModalBodyRef}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-[560px] lg:max-w-[640px] rounded-t-[28px] sm:rounded-[28px] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] p-5 sm:p-6 max-h-[100dvh] sm:max-h-[92dvh] overflow-y-auto overscroll-contain"
            >
              {/* Modal Top Bar */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-3 py-1 font-[var(--font-dot)] text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                      FORMULA #{enlargedFormula.formula.formula_no}
                    </span>
                    <span className="text-xs font-medium text-[var(--text-secondary)]">
                      {enlargedFormula.categoryName} ·{' '}
                      {String(enlargedFormula.chapterNo).padStart(2, '0')}{' '}
                      {enlargedFormula.chapterTitle}
                    </span>
                  </div>
                  <h3 className="mt-2 text-lg sm:text-xl font-bold leading-snug text-[var(--text)] break-words">
                    {enlargedFormula.formula.title ||
                      `Formula #${enlargedFormula.formula.formula_no}`}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={handleCloseEnlarged}
                  aria-label="Close enlarged view"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] transition-transform duration-150 active:scale-[0.95] hover:border-[var(--accent)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Large KaTeX Formula Box in Tinted Panel — shows full formula */}
              <div className="formula-math-scroll flex min-h-[112px] items-center justify-center rounded-[24px] border border-[var(--border)] bg-[var(--surface-2)] px-5 py-7 text-center overflow-x-auto">
                <div className="mx-auto max-w-full text-lg sm:text-2xl font-semibold text-[var(--text)]">
                  <MathText text={`$$${enlargedFormula.formula.formula_latex}$$`} />
                </div>
              </div>

              {/* Formula Note */}
              {enlargedFormula.formula.note && (
                <div className="mt-4 rounded-[20px] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3.5">
                  <span className="block font-[var(--font-dot)] text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                    Note
                  </span>
                  <p className="text-sm leading-relaxed text-[var(--text)]">
                    {enlargedFormula.formula.note}
                  </p>
                </div>
              )}

              {/* Action Pill Buttons (All >= 44px high) */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyText(enlargedFormula.formula.formula_latex, 'latex')}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)] transition-transform duration-150 active:scale-[0.98]"
                >
                  {copiedType === 'latex' ? (
                    <Check className="h-4 w-4 text-[var(--accent)]" />
                  ) : (
                    <Copy className="h-4 w-4" />
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
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)] transition-transform duration-150 active:scale-[0.98]"
                >
                  {copiedType === 'plain' ? (
                    <Check className="h-4 w-4 text-[var(--accent)]" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span>{copiedType === 'plain' ? 'Copied Text' : 'Copy plain text'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleBookmarkClick(enlargedFormula.formula.id)}
                  className={`inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-150 active:scale-[0.98] ${
                    bookmarkedIds.has(enlargedFormula.formula.id)
                      ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--text-on-accent)]'
                      : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] hover:border-[var(--accent)]'
                  }`}
                >
                  <Bookmark
                    className="h-4 w-4"
                    fill={bookmarkedIds.has(enlargedFormula.formula.id) ? 'currentColor' : 'none'}
                  />
                  <span>Bookmark</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const shareUrl = `${window.location.origin}/formulas/${encodeURIComponent(enlargedFormula.formula.id)}`;
                    navigator.clipboard
                      ?.writeText(shareUrl)
                      .then(() => {
                        setCopiedType('share');
                        showToast('Formula link copied to clipboard', 'success');
                        window.setTimeout(() => setCopiedType(null), 1800);
                      })
                      .catch(() => {
                        showToast('Unable to copy link', 'error');
                      });
                  }}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)] transition-transform duration-150 active:scale-[0.98]"
                >
                  {copiedType === 'share' ? (
                    <Check className="h-4 w-4 text-[var(--accent)]" />
                  ) : (
                    <Share2 className="h-4 w-4" />
                  )}
                  <span>{copiedType === 'share' ? 'Link copied!' : 'Share'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportModalOpen((prev) => !prev)}
                  className="ml-auto inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text)] hover:border-[var(--accent)] transition-transform duration-150 active:scale-[0.98]"
                >
                  <Flag className="h-4 w-4" />
                  <span>Report issue</span>
                </button>
              </div>

              {/* Collapsible Report Issue Form */}
              {reportModalOpen && (
                <form
                  onSubmit={handleSubmitReport}
                  className="mt-4 rounded-[20px] border border-[var(--border)] bg-[var(--surface-2)] p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text)]">
                      Report a formula error
                    </span>
                    <button
                      type="button"
                      onClick={() => setReportModalOpen(false)}
                      className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text)]"
                    >
                      Cancel
                    </button>
                  </div>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)]"
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
                    className="w-full min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs text-[var(--text)] placeholder:text-[var(--text-secondary)]"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingReport}
                      className="min-h-[40px] rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-bold text-[var(--text-on-accent)] disabled:opacity-50"
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
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-xs font-bold text-[var(--text)] hover:border-[var(--accent)] transition-transform duration-150 active:scale-[0.98] disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </button>

                <span className="font-[var(--font-dot)] text-xs font-bold text-[var(--text-secondary)]">
                  {enlargedFormula.pool.findIndex((f) => f.id === enlargedFormula.formula.id) + 1}{' '}
                  of {enlargedFormula.pool.length}
                </span>

                <button
                  type="button"
                  onClick={() => handlePrevNextFormula(1)}
                  disabled={enlargedFormula.pool.length <= 1}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-xs font-bold text-[var(--text)] hover:border-[var(--accent)] transition-transform duration-150 active:scale-[0.98] disabled:opacity-40"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default FormulaVaultPage;

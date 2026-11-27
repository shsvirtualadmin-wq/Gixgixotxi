import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Download,
  FileText,
  Filter,
  Search,
  Sparkles,
  Upload,
  Eye,
  X,
  RefreshCw,
  AlertCircle,
  Archive,
  CheckCircle2,
  Calculator,
  Link2,
  Coins,
} from 'lucide-react';
import { PageMeta } from '@/components/ui/PageMeta';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/hooks/useWallet';
import { BoardlyAvatar } from '@/components/ui/BoardlyAvatar';
import {
  PostingWizardModal,
  type WizardPostType,
} from '@/components/commons/PostingWizardModal';
import { createCommonsPost, fetchCommonsPosts } from '@/services/commonsService';
import { uploadCommonsAttachment, extractR2KeyFromUrl } from '@/services/commonsUploadService';
import { buildEntitySlug, maskPublicUserText } from '@/utils/privacy';
import { stripMarkdown } from '@/utils/stripMarkdown';
import { resolveCreatedAtMs, formatRelativeTimePkt } from '@/utils/dateFormat';
import type { CommonsFileAttachment, CommonsPostType } from '@/types/commons';
import { AdSlot } from '@/components/AdSlot';
import { useAdsConfig } from '@/services/adsConfigService';

interface SubjectSiloItem {
  slug: string;
  name: string;
  shortName: string;
}

const SUBJECT_SILOS: SubjectSiloItem[] = [
  { slug: 'mathematics', name: 'Mathematics', shortName: 'Mathematics' },
  { slug: 'physics', name: 'Physics', shortName: 'Physics' },
  { slug: 'chemistry', name: 'Chemistry', shortName: 'Chemistry' },
  { slug: 'biology', name: 'Biology', shortName: 'Biology' },
  { slug: 'computer-science', name: 'Computer Science', shortName: 'Computer Science' },
  { slug: 'english', name: 'English', shortName: 'English' },
  { slug: 'urdu', name: 'Urdu', shortName: 'Urdu' },
  { slug: 'islamiat', name: 'Islamiat', shortName: 'Islamiat' },
  { slug: 'pakistan-studies', name: 'Pakistan Studies', shortName: 'Pak Studies' },
];

function getSubjectSilo(slug: string): SubjectSiloItem | undefined {
  const clean = slug.trim().toLowerCase();
  return SUBJECT_SILOS.find((s) => s.slug === clean);
}

interface MaterialItem {
  id: string;
  title: string;
  description: string;
  type: string;
  subject: string;
  board: string;
  classLevel: string;
  authorName: string;
  authorUsername?: string;
  createdAt: number;
  downloadsCount: number;
  viewsCount: number;
  files: {
    name?: string;
    url?: string;
    size?: number;
    mimeType?: string;
  }[];
}

const RESOURCE_TYPE_OPTIONS: { id: string; label: string }[] = [
  { id: 'all', label: 'All Resource Types' },
  { id: 'notes', label: 'Study Notes' },
  { id: 'past_paper', label: 'Past Papers' },
  { id: 'solved_paper', label: 'Solved Papers' },
  { id: 'formula_sheet', label: 'Formula Sheets' },
  { id: 'resource_link', label: 'Resource Links' },
];

const CURATED_FALLBACK_MATERIALS: MaterialItem[] = [
  {
    id: 'commons_anon_topic_01',
    title: 'Class 9 Mathematics — Real Numbers & Properties Complete Notes',
    description:
      'Comprehensive solved exercises, theorems, and revision notes for Federal & Punjab Board Class 9 Mathematics.',
    type: 'notes',
    subject: 'Mathematics',
    board: 'Federal Board',
    classLevel: 'Class 9',
    authorName: 'Boardly Academic Team',
    authorUsername: 'boardly_academics',
    createdAt: Date.now() - 86400000 * 5,
    downloadsCount: 412,
    viewsCount: 1280,
    files: [
      {
        name: 'Class_9_Mathematics_Real_Numbers_Notes.pdf',
        url: '/api/r2/commons/pdfs/commons_anon_topic_01_Class_9_Mathematics_-_Real_numbers_and_their_properties__Federal_Board_.pdf',
        size: 36648,
        mimeType: 'application/pdf',
      },
    ],
  },
  {
    id: 'commons_anon_topic_06',
    title: 'Class 10 Mathematics — Quadratic Equations Solved Past Papers',
    description:
      'Step-by-step quadratic formula derivations, nature of roots, and solved board exam questions.',
    type: 'solved_paper',
    subject: 'Mathematics',
    board: 'Sindh Board',
    classLevel: 'Class 10',
    authorName: 'Boardly Academic Team',
    authorUsername: 'boardly_academics',
    createdAt: Date.now() - 86400000 * 3,
    downloadsCount: 318,
    viewsCount: 940,
    files: [
      {
        name: 'Class_10_Quadratic_Equations_Solved.pdf',
        url: '/api/r2/commons/pdfs/commons_anon_topic_06_Class_10_Mathematics_-_Quadratic_equations__Sindh_Board_.pdf',
        size: 37956,
        mimeType: 'application/pdf',
      },
    ],
  },
  {
    id: 'commons_anon_topic_05',
    title: 'Class 10 Mathematics — Matrices & Determinants Formula Sheet',
    description:
      'Cramer’s rule, matrix inversion method, determinant properties, and high-yield exam shortcuts.',
    type: 'formula_sheet',
    subject: 'Mathematics',
    board: 'Federal Board',
    classLevel: 'Class 10',
    authorName: 'Boardly Academic Team',
    authorUsername: 'boardly_academics',
    createdAt: Date.now() - 86400000 * 2,
    downloadsCount: 529,
    viewsCount: 1540,
    files: [
      {
        name: 'Matrices_And_Determinants_Formula_Sheet.pdf',
        url: '/api/r2/commons/pdfs/commons_anon_topic_05_Class_10_Mathematics_-_Matrices_and_determinants__Federal_Board_.pdf',
        size: 37868,
        mimeType: 'application/pdf',
      },
    ],
  },
];

function formatFileSize(bytes?: number): string {
  if (!bytes || !Number.isFinite(bytes) || bytes <= 0) return 'PDF · 1.2 MB';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  const kb = Math.max(1, Math.round(bytes / 1024));
  return `${kb} KB`;
}

function formatDateShort(ts?: number): string {
  return formatRelativeTimePkt(ts);
}

function getTypeBadgeAndIcon(type: string) {
  switch (type) {
    case 'past_paper':
      return { label: 'Past Paper', Icon: Archive };
    case 'solved_paper':
      return { label: 'Solved Paper', Icon: CheckCircle2 };
    case 'formula_sheet':
      return { label: 'Formula Sheet', Icon: Calculator };
    case 'resource_link':
      return { label: 'Resource Link', Icon: Link2 };
    default:
      return { label: 'Study Notes', Icon: FileText };
  }
}

export const MaterialLibraryPage: React.FC = () => {
  const { subject, idSlug, itemId } = useParams<{
    subject?: string;
    idSlug?: string;
    itemId?: string;
  }>();
  const navigate = useNavigate();
  const { user, profile, authProfile, isGuest } = useAuth();
  const wallet = useWallet();

  const isSignedIn = Boolean(user && !isGuest);
  const rawSubjectParam = (subject || idSlug || itemId || 'all').toLowerCase();
  const activeSubjectSlug = rawSubjectParam === 'computer' ? 'computer-science' : rawSubjectParam;
  const activeSilo =
    activeSubjectSlug !== 'all' ? getSubjectSilo(activeSubjectSlug) : undefined;

  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const loadMaterials = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const feedRes = await fetchCommonsPosts({
        feedTab: 'all',
        pageSize: 100,
        currentUid: user?.uid,
      });
      const rawPosts = Array.isArray(feedRes?.posts) ? feedRes.posts : [];

      const normalized: MaterialItem[] = rawPosts.map((p: any) => {
        let parsedFiles: any[] = [];
        if (Array.isArray(p.files)) {
          parsedFiles = p.files;
        } else if (typeof p.files_json === 'string') {
          try {
            const f = JSON.parse(p.files_json);
            if (Array.isArray(f)) parsedFiles = f;
          } catch {
            // ignore
          }
        }
        parsedFiles = parsedFiles.map((f: any) => {
          const rawUrl = String(f?.url || '').trim();
          const r2Key = f?.r2Key || extractR2KeyFromUrl(rawUrl);
          const safeUrl =
            r2Key && r2Key.startsWith('commons/')
              ? `/api/r2/${r2Key}`
              : rawUrl.startsWith('/api/commons/r2/')
              ? `/api/r2/${rawUrl.slice('/api/commons/r2/'.length)}`
              : rawUrl;
          return {
            name: f?.name,
            url: safeUrl,
            size: f?.size,
            mimeType: f?.mimeType || f?.type,
          };
        });

        const createdMs = resolveCreatedAtMs(p).ms ?? 0;

        return {
          id: String(p.id || ''),
          title: String(p.title || 'Study Material'),
          description: String(p.description || ''),
          type: String(p.type || 'notes'),
          subject: String(p.subject || 'General'),
          board: String(p.board || 'All Boards'),
          classLevel: String(p.classLevel || p.class_level || 'All Classes'),
          authorName: String(p.authorName || p.author_name || 'Student Contributor'),
          authorUsername: p.authorUsername || p.author_username || undefined,
          createdAt: createdMs,
          downloadsCount: Number(p.downloadsCount ?? p.downloads_count ?? p.saveCount ?? 0),
          viewsCount: Number(p.viewsCount ?? p.views_count ?? p.views ?? 0),
          files: parsedFiles,
        };
      });

      const studyItems = normalized.filter((item) => item.id && item.title);
      if (studyItems.length > 0) {
        setMaterials(studyItems);
      } else {
        setMaterials(CURATED_FALLBACK_MATERIALS);
      }
    } catch {
      setMaterials(CURATED_FALLBACK_MATERIALS);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    void loadMaterials();
  }, [loadMaterials]);

  const hasActiveFilterOrSearch =
    activeSubjectSlug !== 'all' ||
    selectedType !== 'all' ||
    searchQuery.trim().length > 0;

  const { config: adsConfig } = useAdsConfig();
  const materialFeedEveryN = Math.max(2, adsConfig.slots.material_feed?.everyN || 5);
  const filteredMaterials = useMemo(() => {
    return materials.filter((item) => {
      if (activeSilo) {
        const subj = (item.subject || '').toLowerCase();
        const title = (item.title || '').toLowerCase();
        const matchesSubject =
          subj.includes(activeSilo.slug) ||
          subj.includes(activeSilo.name.toLowerCase()) ||
          title.includes(activeSilo.slug);
        if (!matchesSubject) return false;
      }
      if (selectedType !== 'all' && item.type !== selectedType) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          (item.title || '').toLowerCase().includes(q) ||
          (item.description || '').toLowerCase().includes(q) ||
          (item.subject || '').toLowerCase().includes(q) ||
          (item.board || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [materials, activeSilo, selectedType, searchQuery]);

  const handleOpenUpload = () => {
    if (!user) {
      navigate('/login?redirect=/material');
      return;
    }
    setIsUploadModalOpen(true);
  };

  const handleWizardSubmit = async (data: {
    type: WizardPostType;
    board: any;
    classLevel: any;
    subject: string;
    title: string;
    description: string;
    tags: string[];
    files: File[];
    isAnonymous: boolean;
  }) => {
    if (!user) {
      navigate('/login?redirect=/material');
      return;
    }
    const postId = `post_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const uploadedAttachments: CommonsFileAttachment[] = [];
    for (const f of data.files) {
      const uploaded = await uploadCommonsAttachment({
        file: f,
        postId,
        uid: user.uid,
      });
      uploadedAttachments.push(uploaded);
    }

    await createCommonsPost({
      postId,
      currentUser: {
        uid: user.uid,
        email: user.email,
        displayName:
          (authProfile as any)?.displayName ||
          profile?.nickname ||
          profile?.displayName ||
          user.displayName ||
          'Student',
        equippedAvatar: profile?.equippedAvatar || profile?.avatar || 'avatar-1',
        frame: profile?.equippedFrame || profile?.frame || 'none',
        role: profile?.role || 'student',
        customRole: profile?.customRole || null,
      },
      type: (data.type === 'question' ? 'doubt' : data.type) as CommonsPostType,
      title: data.title,
      description: data.description,
      subject: data.subject,
      target: `${data.board} · ${data.classLevel}`,
      tags: data.tags,
      files: uploadedAttachments,
      isAnonymous: data.isAnonymous,
    });
    await loadMaterials();
  };

  const pageTitle = activeSilo
    ? `${activeSilo.name} Study Material, Notes & Formula Sheets | Boardly`
    : 'Study Material Library — Notes, Formula Sheets & Solved Papers | Boardly';

  const pageDescription = activeSilo
    ? `Download free ${activeSilo.name} study notes, chapter summaries, formula sheets, and solved past papers for Matric, FSc, O/A Levels, and Entry Tests.`
    : 'Access free Pakistani board & university entry test study notes, formula sheets, solved papers, and revision guides shared by top students and educators.';

  const canonicalPath = activeSilo ? `/material/${activeSilo.slug}` : '/material';

  return (
    <div
      data-student-page="material"
      className="relative min-h-screen bg-[var(--bg)] text-[var(--text)] boardly-page-safe-bottom overflow-x-hidden"
    >
      <PageMeta
        title={pageTitle}
        description={pageDescription}
        canonicalPath={canonicalPath}
      />

      {/* Ambient blurred red (#D71921) and blue (#3a4cff) glows */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden z-0"
        aria-hidden="true"
      >
        <div className="absolute -top-28 -left-24 w-[360px] h-[360px] rounded-full bg-[#D71921]/15 dark:bg-[#D71921]/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-28 w-[340px] h-[340px] rounded-full bg-[#3a4cff]/12 dark:bg-[#3a4cff]/16 blur-[130px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-3.5 sm:px-6 pt-3 pb-16 space-y-4">
        {/* 1. FLOATING GLASS TOP BAR: back, "Material", koban chip, avatar (Never overflows) */}
        <header className="boardly-glass-pill sticky top-3 z-30 h-14 px-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 2) {
                  navigate(-1);
                } else {
                  navigate('/commons');
                }
              }}
              aria-label="Go back"
              className="press-scale w-11 h-11 rounded-full flex items-center justify-center text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-doto-title text-[15px] sm:text-[16px] tracking-[0.14em] text-[var(--text)] truncate">
              MATERIAL
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/store')}
              className="press-scale h-9 px-3 rounded-full bg-amber-500/15 border border-amber-400/40 inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-200 font-inter-num cursor-pointer"
            >
              <Coins className="w-3.5 h-3.5 text-amber-500 dark:text-amber-300 shrink-0" />
              <span>{Number(wallet.balance || 0).toLocaleString()}</span>
            </button>

            <button
              type="button"
              onClick={() => navigate(user ? '/profile' : '/login')}
              aria-label="Profile"
              className="press-scale rounded-full p-0.5 border border-[var(--border)] cursor-pointer shrink-0"
            >
              <BoardlyAvatar
                size={34}
                uid={user?.uid}
                equippedAvatar={profile?.equippedAvatar || 'avatar-1'}
                customPhotoURL={profile?.photoURL}
                equippedFrameId={profile?.equippedFrame}
              />
            </button>
          </div>
        </header>

        {/* 2. BREADCRUMB AS SMALL GLASS CHIPS (No large blank gap!) */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 flex-wrap pt-0.5"
        >
          <Link
            to="/"
            className="px-3 py-1 rounded-full text-[11px] font-semibold bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
          >
            Home
          </Link>
          <span className="text-[var(--text-muted)] text-xs">/</span>
          <Link
            to="/material"
            className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
              !activeSilo
                ? 'bg-[#D71921]/15 border-[#D71921]/45 text-[#D71921] dark:text-white'
                : 'bg-[var(--surface)] hover:bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)]'
            }`}
          >
            Study Material
          </Link>
          {activeSilo && (
            <>
              <span className="text-[var(--text-muted)] text-xs">/</span>
              <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-[#D71921]/15 border border-[#D71921]/45 text-[#D71921] dark:text-white">
                {activeSilo.name}
              </span>
            </>
          )}
        </nav>

        {/* 3. HERO GLASS CARD */}
        <section className="boardly-glass-card rounded-[32px] p-5 sm:p-7 relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 opacity-20 dark:opacity-20"
            style={{
              backgroundImage:
                'radial-gradient(currentColor 1px, transparent 1px)',
              backgroundSize: '12px 12px',
            }}
          />
          <div className="relative z-10 space-y-3">
            {/* Small Doto label "STUDY RESOURCE INDEX" (not a red button) */}
            <div className="font-doto-title text-[11px] tracking-[0.18em] text-[var(--text-secondary)] uppercase">
              STUDY RESOURCE INDEX
            </div>

            {/* Doto title "Study Material Library" (28px) */}
            <h1 className="font-doto-title text-[26px] sm:text-[28px] leading-tight text-[var(--text)]">
              {activeSilo
                ? `${activeSilo.name} Study Material`
                : 'Study Material Library'}
            </h1>

            {/* Short Inter description: Signed-in vs Signed-out copy */}
            <p className="text-[14px] sm:text-[15px] text-[var(--text-secondary)] font-sans leading-relaxed max-w-2xl">
              {isSignedIn
                ? 'Browse, download and share study material.'
                : 'Sign in to download full PDFs or upload your own notes.'}
            </p>

            {/* Full-width red "Upload Study Material" pill with glow */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleOpenUpload}
                className="boardly-red-pill press-scale w-full min-h-[50px] px-5 rounded-full text-sm font-bold tracking-wide flex items-center justify-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Study Material</span>
              </button>
            </div>
          </div>
        </section>

        {/* 4. SUBJECT CHIPS IN ONE HORIZONTALLY SCROLLABLE ROW WITH SHARED SLIDING RED PILL */}
        <div
          aria-label="Subject Filter"
          className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1"
        >
          <Link
            to="/material"
            className={`press-scale min-h-[48px] px-4 rounded-full inline-flex items-center justify-center text-xs font-bold tracking-wide whitespace-nowrap transition-all ${
              activeSubjectSlug === 'all'
                ? 'boardly-red-pill text-white'
                : 'boardly-glass-pill text-[var(--text-secondary)] hover:text-[var(--text)]'
            }`}
          >
            All Subjects
          </Link>
          {SUBJECT_SILOS.map((s) => {
            const active = activeSubjectSlug === s.slug;
            return (
              <Link
                key={s.slug}
                to={`/material/${s.slug}`}
                className={`press-scale min-h-[48px] px-4 rounded-full inline-flex items-center justify-center text-xs font-bold tracking-wide whitespace-nowrap transition-all ${
                  active
                    ? 'boardly-red-pill text-white'
                    : 'boardly-glass-pill text-[var(--text-secondary)] hover:text-[var(--text)]'
                }`}
              >
                {s.name}
              </Link>
            );
          })}
        </div>

        {/* 5. ONE GLASS SEARCH PILL (S1) + RESOURCE-TYPE FILTER AS iOS-STYLE MENU CHIP */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="search-pill-wrapper boardly-glass-pill flex-1 min-h-[48px] px-4 flex items-center gap-2.5 transition-all">
            <Search className="w-4 h-4 text-[var(--text-muted)] shrink-0 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes, formula sheets, or chapters..."
              aria-label="Search study material"
              className="flex-1 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="w-7 h-7 rounded-full bg-[var(--surface-2)] hover:bg-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Resource-Type Filter as an iOS-style Menu Chip */}
          <div className="boardly-glass-pill min-h-[48px] px-4 flex items-center gap-2 shrink-0">
            <Filter className="w-4 h-4 text-[#D71921] shrink-0 pointer-events-none" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              aria-label="Filter by resource type"
              className="bg-transparent text-xs font-bold text-[var(--text)] outline-none cursor-pointer pr-2"
            >
              {RESOURCE_TYPE_OPTIONS.map((opt) => (
                <option
                  key={opt.id}
                  value={opt.id}
                  className="bg-[var(--surface)] text-[var(--text)]"
                >
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 6. RESULTS AS GLASS CARDS / SKELETONS / ERROR / EMPTY STATES */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="boardly-glass-card rounded-[26px] p-5 animate-pulse space-y-3"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--surface-2)] shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-3/4 rounded bg-[var(--surface-2)]" />
                    <div className="h-3 w-1/2 rounded bg-[var(--surface-2)]" />
                  </div>
                </div>
                <div className="h-10 w-full rounded-xl bg-[var(--surface-2)]" />
                <div className="h-9 w-full rounded-full bg-[var(--surface-2)]" />
              </div>
            ))}
          </div>
        ) : fetchError ? (
          <div className="boardly-glass-card rounded-[28px] p-8 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-[#D71921] mx-auto" />
            <h2 className="text-base font-bold text-[var(--text)]">
              Could not load study material
            </h2>
            <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">{fetchError}</p>
            <button
              type="button"
              onClick={() => void loadMaterials()}
              className="boardly-red-pill press-scale min-h-[48px] px-6 rounded-full text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </button>
          </div>
        ) : filteredMaterials.length === 0 ? (
          hasActiveFilterOrSearch ? (
            <div className="boardly-glass-card rounded-[28px] p-10 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-[var(--text-muted)] mx-auto" />
              <h2 className="text-base font-bold text-[var(--text)]">
                No study materials match your current filter
              </h2>
              <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
                Try clearing your search or switching to All Subjects and All Resource
                Types.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedType('all');
                  if (activeSubjectSlug !== 'all') {
                    navigate('/material');
                  }
                }}
                className="boardly-glass-pill press-scale min-h-[48px] px-5 rounded-full text-xs font-bold text-[var(--text)] cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="boardly-glass-card rounded-[28px] p-10 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-[var(--text-muted)] mx-auto" />
              <h2 className="text-base font-bold text-[var(--text)]">
                No study material yet. Be the first to share
              </h2>
              <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
                Upload your notes, past papers, or formula sheets to help students across
                Pakistan.
              </p>
              <button
                type="button"
                onClick={handleOpenUpload}
                className="boardly-red-pill press-scale min-h-[48px] px-6 rounded-full text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Upload</span>
              </button>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredMaterials.map((item, idx) => {
              const { label: typeLabel, Icon: TypeIcon } = getTypeBadgeAndIcon(item.type);
              const firstFile = item.files?.[0];
              const fileTypeLabel = firstFile?.mimeType?.includes('image')
                ? 'IMG'
                : 'PDF';
              const sizeStr = formatFileSize(firstFile?.size);

              return (
                <React.Fragment key={item.id}>
                  <article
                    style={{ animationDelay: `${Math.min(idx * 40, 240)}ms` }}
                    className="boardly-glass-card rounded-[26px] p-5 flex flex-col justify-between gap-4 transition-all hover:border-[var(--border-strong)]"
                  >
                  <div className="space-y-3">
                    {/* Top Row: Type Icon Tile + Title + Subject Chip */}
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-[#D71921]/15 border border-[#D71921]/35 flex items-center justify-center text-[#D71921] dark:text-[#ff6b72] shrink-0">
                        <TypeIcon className="w-6 h-6" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D71921]/15 border border-[#D71921]/35 text-[#D71921] dark:text-[#ff8b90]">
                            {item.subject || 'General'}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-secondary)]">
                            {typeLabel}
                          </span>
                        </div>

                        <Link
                          to={`/material/${buildEntitySlug(item.id, item.title)}`}
                          className="block text-[16px] font-bold text-[var(--text)] hover:text-[#D71921] dark:hover:text-[#ff6b72] transition-colors line-clamp-2 leading-snug"
                        >
                          {item.title}
                        </Link>
                      </div>
                    </div>

                    {stripMarkdown(maskPublicUserText(item.description)) && (
                      <p className="text-[13px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                        {stripMarkdown(maskPublicUserText(item.description))}
                      </p>
                    )}
                  </div>

                  {/* Footer Metadata: Uploader, Date, File Type + Size, Download Button */}
                  <div className="pt-3 nothing-dotted-divider flex items-center justify-between gap-3">
                    <div className="min-w-0 text-[11px] text-[var(--text-muted)] space-y-0.5">
                      <div className="font-semibold text-[var(--text-secondary)] truncate">
                        By {item.authorName}
                      </div>
                      <div className="flex items-center gap-1.5 font-inter-num">
                        <span>{formatDateShort(item.createdAt)}</span>
                        <span>·</span>
                        <span>
                          {fileTypeLabel} ({sizeStr})
                        </span>
                      </div>
                    </div>

                    {firstFile?.url ? (
                      <a
                        href={firstFile.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="boardly-red-pill press-scale min-h-[44px] px-4 rounded-full text-xs font-bold inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                    ) : (
                      <Link
                        to={`/material/${buildEntitySlug(item.id, item.title)}`}
                        className="boardly-glass-pill press-scale min-h-[44px] px-4 rounded-full text-xs font-bold inline-flex items-center gap-1.5 text-[var(--text)] shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#D71921]" />
                        <span>Open</span>
                      </Link>
                    )}
                  </div>
                  </article>
                  {(idx === 3 || (idx > 3 && (idx - 3) % materialFeedEveryN === 0)) && (
                    <AdSlot
                      slotId="material_feed"
                      instanceKey={`mat-${idx}`}
                      wrapperClassName="md:col-span-2 my-5 sm:my-6"
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      {/* Share Study Resource Popup (Part 3 Bottom Sheet) */}
      <PostingWizardModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSubmit={handleWizardSubmit}
      />
    </div>
  );
};

export default MaterialLibraryPage;

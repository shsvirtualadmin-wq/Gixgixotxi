import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderOpen,
  FileText,
  Download,
  Search,
  Filter,
  ArrowRight,
  Upload,
} from 'lucide-react';
import { PageMeta } from '@/components/ui/PageMeta';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { MathText } from '@/components/ui/MathText';
import { fetchCommonsPosts } from '@/services/commonsService';
import { resolveCommonsAttachmentUrl } from '@/services/commonsUploadService';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthGate } from '@/contexts/AuthGateContext';
import { sanitizeStudentDisplayName, maskPublicUserText, buildEntitySlug } from '@/utils/privacy';
import type { CommonsPost } from '@/types/commons';
import { COMMONS_POST_TYPES } from '@/types/commons';

const MATERIAL_SUBJECTS = [
  { slug: 'all', label: 'All Subjects' },
  { slug: 'mathematics', label: 'Mathematics' },
  { slug: 'physics', label: 'Physics' },
  { slug: 'chemistry', label: 'Chemistry' },
  { slug: 'biology', label: 'Biology' },
  { slug: 'english', label: 'English' },
  { slug: 'computer-science', label: 'Computer Science' },
];

export const MaterialLibraryPage: React.FC = () => {
  const { user } = useAuth();
  const { requireAuth } = useAuthGate();

  const [posts, setPosts] = useState<CommonsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchCommonsPosts({ feedTab: 'all', pageSize: 40, currentUid: user?.uid })
      .then((res) => {
        if (!mounted) return;
        const materialPosts = res.posts.filter(
          (p) =>
            (p.files && p.files.length > 0) ||
            ['notes', 'past_paper', 'solved_paper', 'formula_sheet', 'resource_link'].includes(
              p.type
            )
        );
        setPosts(materialPosts);
      })
      .catch(() => {
        if (mounted) setPosts([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [user?.uid]);

  const filteredMaterials = useMemo(() => {
    return posts.filter((p) => {
      if (subjectFilter !== 'all') {
        const cleanSub = subjectFilter.replace(/-/g, ' ').toLowerCase();
        const postSub = (p.subject || '').toLowerCase();
        const matchSub =
          postSub.includes(cleanSub) ||
          cleanSub.includes(postSub) ||
          (p.tags || []).some((t) => t.toLowerCase().includes(cleanSub));
        if (!matchSub) return false;
      }
      if (typeFilter !== 'all' && p.type !== typeFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const hay = `${p.title} ${p.description} ${p.subject} ${p.chapter} ${(p.tags || []).join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [posts, subjectFilter, typeFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pt-28 pb-24 px-4 sm:px-6">
      <PageMeta
        title="Study Material Library — Free FSc, MDCAT & ECAT Notes, PDFs & Past Papers"
        description="Browse and preview peer-shared Class 11 & 12 handwritten notes, formula sheets, and solved board past papers across Mathematics, Physics, Chemistry, Biology, and Computer Science."
        canonicalPath="/material"
      />

      <div className="max-w-5xl mx-auto">
        <Breadcrumbs items={[{ label: 'Study Material Library' }]} />

        {/* Header */}
        <section className="glass-panel p-8 sm:p-10 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="section-chip-red mb-3">
              <FolderOpen size={13} />
              <span>Open Study Resource Index</span>
            </div>
            <h1 className="font-dot text-3xl sm:text-4xl font-bold text-white mb-2">
              Study Material Library
            </h1>
            <p className="text-sm sm:text-base text-white/70 max-w-2xl leading-relaxed">
              Every resource page shows the title, subject, file details, description, and uploader publicly. Sign in to download full PDFs or upload your own notes.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              requireAuth('upload study material to Boardly Commons', undefined, '/commons/new')
            }
            className="btn-primary px-5 py-3 text-xs font-semibold inline-flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Upload size={15} />
            <span>Upload Study Material</span>
          </button>
        </section>

        {/* Subject Quick Links */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {MATERIAL_SUBJECTS.map((s) => (
            <button
              key={s.slug}
              type="button"
              onClick={() => setSubjectFilter(s.slug)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                subjectFilter === s.slug
                  ? 'bg-[#D71921] text-white border-[#D71921]'
                  : 'bg-white/[0.03] border-white/10 text-white/70 hover:text-white'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Search & Type Filter Bar */}
        <div className="glass-card p-4 mb-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes, past papers, chapters, or formula sheets..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs sm:text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#D71921]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={14} className="text-white/50 shrink-0" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter by material type"
              className="px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white focus:outline-none"
            >
              <option value="all" className="bg-[#0E0E13]">All Resource Types</option>
              <option value="notes" className="bg-[#0E0E13]">Study Notes</option>
              <option value="past_paper" className="bg-[#0E0E13]">Past Papers</option>
              <option value="solved_paper" className="bg-[#0E0E13]">Solved Papers</option>
              <option value="formula_sheet" className="bg-[#0E0E13]">Formula Sheets</option>
            </select>
          </div>
        </div>

        {/* Material Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card p-6 h-40 animate-pulse" />
            ))}
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="glass-panel p-10 text-center">
            <FileText size={28} className="text-white/40 mx-auto mb-3" />
            <h2 className="font-dot text-xl font-bold text-white mb-2">
              No study materials match your current filter
            </h2>
            <p className="text-xs text-white/60 mb-6">
              Try clearing your filter or explore our interactive chapter MCQs and Boardly Commons feed.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSubjectFilter('all');
                  setTypeFilter('all');
                  setSearchQuery('');
                }}
                className="btn-primary px-5 py-2.5 text-xs font-semibold cursor-pointer"
              >
                Reset Filters
              </button>
              <Link to="/mcqs" className="btn-secondary px-5 py-2.5 text-xs font-semibold">
                Explore Chapter MCQs
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMaterials.map((item) => {
              const slug = buildEntitySlug(item.id, item.title);
              const typeMeta = COMMONS_POST_TYPES[item.type] || COMMONS_POST_TYPES.notes;
              const firstFile = item.files?.[0];
              const authorLabel = item.isAnonymous
                ? item.anonymousAlias || 'Anonymous Student'
                : sanitizeStudentDisplayName(item.authorName, item.authorUid);

              return (
                <div
                  key={item.id}
                  className="glass-card p-6 flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#D71921]">
                        {item.subject || 'General'} · {typeMeta.badgeLabel}
                      </span>
                      {firstFile?.size ? (
                        <span className="glass-pill px-2.5 py-0.5 text-[10px] text-white/60">
                          {(firstFile.size / 1024).toFixed(0)} KB
                        </span>
                      ) : null}
                    </div>

                    <Link
                      to={`/material/${slug}`}
                      className="font-dot text-lg font-bold text-white hover:text-[#D71921] transition-colors block mb-2"
                    >
                      <MathText text={item.title} />
                    </Link>

                    <div className="text-xs text-white/65 line-clamp-2 leading-relaxed mb-3">
                      <MathText text={maskPublicUserText(item.description)} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/[0.08]">
                    <span className="text-[11px] text-white/50 truncate">
                      Shared by <strong className="text-white/80">{authorLabel}</strong>
                    </span>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        to={`/material/${slug}`}
                        className="btn-secondary px-3.5 py-1.5 text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <span>Preview</span>
                        <ArrowRight size={12} />
                      </Link>
                      {firstFile && (
                        <button
                          type="button"
                          onClick={() =>
                            requireAuth('download this study material', async () => {
                              try {
                                const resolvedUrl = await resolveCommonsAttachmentUrl(firstFile.url);
                                const a = document.createElement('a');
                                a.href = resolvedUrl;
                                a.download = firstFile.name || 'study-material.pdf';
                                a.target = '_blank';
                                a.rel = 'noopener noreferrer';
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                              } catch (err) {
                                console.warn('[MaterialLibraryPage] Attachment download error:', err);
                              }
                            })
                          }
                          className="btn-primary px-3.5 py-1.5 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Download size={12} />
                          <span>Download</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MaterialLibraryPage;

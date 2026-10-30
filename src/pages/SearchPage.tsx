import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, BookOpen, FolderOpen, MessageSquare, ArrowRight } from 'lucide-react';
import { PageMeta } from '@/components/ui/PageMeta';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { fetchCommonsPosts } from '@/services/commonsService';
import { SYLLABUS_MAP } from '@/constants/syllabusMap';
import { slugify } from '@/constants/taxonomy';
import { maskPublicUserText, buildEntitySlug } from '@/utils/privacy';
import type { CommonsPost } from '@/types/commons';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get('q') || '';

  const [queryText, setQueryText] = useState(initialQ);
  const [typeFilter, setTypeFilter] = useState<'all' | 'mcqs' | 'material' | 'posts'>('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [posts, setPosts] = useState<CommonsPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setQueryText(searchParams.get('q') || '');
  }, [searchParams]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchCommonsPosts({ feedTab: 'all', pageSize: 40 })
      .then((res) => {
        if (mounted) setPosts(res.posts);
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
  }, []);

  const allChapters = useMemo(() => {
    const items: Array<{ subjectSlug: string; subjectLabel: string; chapterName: string; classLevel: string }> = [];
    Object.keys(SYLLABUS_MAP).forEach((subKey) => {
      const entry = SYLLABUS_MAP[subKey];
      if (!entry) return;
      const subjectLabel = entry.name || subKey;
      const subjectSlug = entry.slug || subKey;
      (entry.chaptersClass11 ?? []).forEach((ch) =>
        items.push({
          subjectSlug,
          subjectLabel,
          chapterName: typeof ch === 'string' ? ch : ch.name,
          classLevel: 'Class 11',
        })
      );
      (entry.chaptersClass12 ?? []).forEach((ch) =>
        items.push({
          subjectSlug,
          subjectLabel,
          chapterName: typeof ch === 'string' ? ch : ch.name,
          classLevel: 'Class 12',
        })
      );
    });
    return items;
  }, []);

  const cleanQ = queryText.trim().toLowerCase();

  const matchedChapters = useMemo(() => {
    if (typeFilter !== 'all' && typeFilter !== 'mcqs') return [];
    return allChapters
      .filter((item) => {
        if (subjectFilter !== 'all' && !item.subjectSlug.includes(subjectFilter)) return false;
        if (!cleanQ) return true;
        return (
          item.chapterName.toLowerCase().includes(cleanQ) ||
          item.subjectLabel.toLowerCase().includes(cleanQ)
        );
      })
      .slice(0, 12);
  }, [allChapters, cleanQ, subjectFilter, typeFilter]);

  const matchedPosts = useMemo(() => {
    if (typeFilter !== 'all' && typeFilter !== 'posts' && typeFilter !== 'material') return [];
    return posts.filter((p) => {
      if (typeFilter === 'material' && (!p.files || p.files.length === 0)) return false;
      if (subjectFilter !== 'all') {
        const s = (p.subject || '').toLowerCase();
        if (!s.includes(subjectFilter)) return false;
      }
      if (!cleanQ) return true;
      const hay = `${p.title} ${p.description} ${p.subject} ${p.chapter} ${(p.tags || []).join(' ')}`.toLowerCase();
      return hay.includes(cleanQ);
    });
  }, [posts, cleanQ, subjectFilter, typeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (queryText.trim()) {
      setSearchParams({ q: queryText.trim() });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pt-28 pb-24 px-4 sm:px-6">
      {/* Phase 2 rule: /search?q= uses noindex so Google indexes real content pages instead of empty search queries */}
      <PageMeta
        title={
          cleanQ
            ? `Search Results for "${queryText}" — Boardly`
            : 'Search MCQs, Study Material & Commons Posts — Boardly'
        }
        description="Search across Boardly's Class 11 & 12 MCQ chapters, peer-shared study materials, formula sheets, and Commons discussions."
        canonicalPath="/search"
        noindex={true}
      />

      <div className="max-w-5xl mx-auto">
        <Breadcrumbs items={[{ label: 'Search' }]} />

        <section className="glass-panel p-6 sm:p-8 mb-8">
          <h1 className="font-dot text-2xl sm:text-4xl font-bold text-[var(--text)] mb-4">
            Search Boardly
          </h1>

          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
              />
              <input
                type="search"
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder="Search chapters (e.g. Vectors, Stoichiometry), past papers, or doubts..."
                className="w-full pl-11 pr-4 py-3 rounded-xl glass-input text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[#D71921]"
              />
            </div>
            <button
              type="submit"
              className="btn-primary px-6 py-3 text-xs sm:text-sm font-semibold cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: 'all', label: 'All Results' },
                  { id: 'mcqs', label: 'MCQ Chapters' },
                  { id: 'material', label: 'Study Material' },
                  { id: 'posts', label: 'Commons Posts' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTypeFilter(tab.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                    typeFilter === tab.id
                      ? 'bg-[#D71921] text-white border-[#D71921]'
                      : 'glass-pill text-[var(--muted)] hover:text-[var(--text)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              aria-label="Filter by subject"
              className="px-3.5 py-1.5 rounded-full glass-pill text-xs text-[var(--text)] focus:outline-none"
            >
              <option value="all" className="bg-[var(--surface)] text-[var(--text)]">All Subjects</option>
              <option value="math" className="bg-[var(--surface)] text-[var(--text)]">Mathematics</option>
              <option value="phys" className="bg-[var(--surface)] text-[var(--text)]">Physics</option>
              <option value="chem" className="bg-[var(--surface)] text-[var(--text)]">Chemistry</option>
              <option value="bio" className="bg-[var(--surface)] text-[var(--text)]">Biology</option>
              <option value="comp" className="bg-[var(--surface)] text-[var(--text)]">Computer Science</option>
              <option value="eng" className="bg-[var(--surface)] text-[var(--text)]">English</option>
            </select>
          </div>
        </section>

        {/* MCQ Chapters Results */}
        {matchedChapters.length > 0 && (
          <section className="glass-panel p-6 sm:p-8 mb-8">
            <h2 className="font-dot text-xl font-bold text-[var(--text)] mb-4 flex items-center gap-2">
              <BookOpen size={18} className="text-[#D71921]" />
              <span>Syllabus &amp; MCQ Chapters ({matchedChapters.length})</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {matchedChapters.map((ch, idx) => (
                <Link
                  key={`${ch.subjectSlug}-${ch.chapterName}-${idx}`}
                  to={`/mcqs/${ch.subjectSlug}/${slugify(ch.chapterName)}`}
                  className="glass-card-interactive p-4 flex flex-col justify-between gap-2"
                >
                  <div>
                    <span className="text-[10px] font-semibold uppercase text-[#D71921]">
                      {ch.subjectLabel} · {ch.classLevel}
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-[var(--text)] mt-0.5">
                      {ch.chapterName}
                    </h3>
                  </div>
                  <span className="text-[11px] text-[var(--muted)] inline-flex items-center gap-1">
                    <span>Practice Sample MCQs</span>
                    <ArrowRight size={11} />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Commons Posts & Study Material Results */}
        <section className="glass-panel p-6 sm:p-8">
          <h2 className="font-dot text-xl font-bold text-[var(--text)] mb-4 flex items-center gap-2">
            {typeFilter === 'material' ? (
              <FolderOpen size={18} className="text-[#D71921]" />
            ) : (
              <MessageSquare size={18} className="text-[#D71921]" />
            )}
            <span>
              {typeFilter === 'material'
                ? `Study Materials (${matchedPosts.length})`
                : `Commons Posts & Study Notes (${matchedPosts.length})`}
            </span>
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card h-24 animate-pulse" />
              ))}
            </div>
          ) : matchedPosts.length === 0 ? (
            <p className="text-xs text-[var(--muted)] py-6 text-center">
              No community posts or study materials matched your search query.
            </p>
          ) : (
            <div className="boardly-feed-container space-y-3 w-full max-w-full min-w-0 box-border overflow-x-hidden">
              {matchedPosts.map((post) => {
                const slug = buildEntitySlug(post.id, post.title);
                const hasFile = Boolean(post.files && post.files.length > 0);
                const dest = hasFile ? `/material/${slug}` : `/commons/post/${slug}`;
                return (
                  <Link key={post.id} to={dest} className="boardly-post-card glass-card-interactive p-4 block w-full max-w-full min-w-0 box-border overflow-x-hidden">
                    <div className="flex items-center justify-between gap-2 mb-1 min-w-0">
                      <span className="text-[11px] font-semibold uppercase text-[#D71921] truncate">
                        {post.subject || 'General'} · {hasFile ? 'Study Material' : 'Commons Post'}
                      </span>
                      <span className="text-[11px] text-[var(--muted)] shrink-0">
                        👍 {post.upvotes || 0}
                      </span>
                    </div>
                    <h3 className="boardly-post-title text-sm font-bold text-[var(--text)] mb-1 min-w-0 max-w-full [overflow-wrap:anywhere] [word-break:break-word]">{post.title}</h3>
                    <p className="boardly-post-content text-xs text-[var(--muted)] line-clamp-2 min-w-0 max-w-full [overflow-wrap:anywhere] [word-break:break-word]">
                      {maskPublicUserText(post.description)}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default SearchPage;

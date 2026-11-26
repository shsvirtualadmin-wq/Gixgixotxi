import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  BookOpen,
  ExternalLink,
  MessageSquare,
  RefreshCw,
  Search,
  Sigma,
  ThumbsUp,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PageMeta } from '@/components/ui/PageMeta';
import { MathText } from '@/components/ui/MathText';
import {
  fetchBookmarkedFormulas,
  toggleFormulaBookmark,
  type D1FormulaItemRow,
} from '@/services/formulaVaultService';
import { fetchUserSavedPosts, toggleSavePost } from '@/services/commonsService';
import type { CommonsPost } from '@/types/commons';
import { buildEntitySlug, maskPublicUserText } from '@/utils/privacy';

type BookmarkTab = 'all' | 'formulas' | 'posts';

type BookmarkedFormulaItem = D1FormulaItemRow & {
  chapter_title?: string;
  chapter_no?: number;
  category_name?: string;
};

function formatRelativeDate(value: unknown): string {
  if (!value) return '';
  let ts = 0;
  if (typeof value === 'number') {
    ts = value < 1e12 ? value * 1000 : value;
  } else if (typeof value === 'string') {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) ts = parsed;
  } else if (typeof (value as { toMillis?: () => number }).toMillis === 'function') {
    ts = (value as { toMillis: () => number }).toMillis();
  }
  if (!ts) return '';
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 86400 * 30) return `${Math.floor(diffSec / 86400)}d ago`;
  return new Date(ts).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export const BookmarksPage: React.FC = () => {
  const { user, isGuest, authStatus } = useAuth();
  const [activeTab, setActiveTab] = useState<BookmarkTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [formulas, setFormulas] = useState<BookmarkedFormulaItem[]>([]);
  const [posts, setPosts] = useState<CommonsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removingIds, setRemovingIds] = useState<Record<string, boolean>>({});

  const loadBookmarks = useCallback(
    async (isManualRefresh = false) => {
      if (!user?.uid || isGuest) {
        setFormulas([]);
        setPosts([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const [formulaResult, postResult] = await Promise.allSettled([
          fetchBookmarkedFormulas(),
          fetchUserSavedPosts(user.uid),
        ]);

        const nextFormulas =
          formulaResult.status === 'fulfilled' && Array.isArray(formulaResult.value)
            ? formulaResult.value
            : [];
        const nextPosts =
          postResult.status === 'fulfilled' && Array.isArray(postResult.value)
            ? postResult.value
            : [];

        setFormulas(nextFormulas);
        setPosts(nextPosts);

        if (formulaResult.status === 'rejected' && postResult.status === 'rejected') {
          setError('Could not load your saved bookmarks right now. Please try again.');
        }
      } catch {
        setError('Could not load your saved bookmarks right now. Please try again.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.uid, isGuest]
  );

  useEffect(() => {
    if (authStatus === 'loading') return;
    void loadBookmarks(false);
  }, [authStatus, loadBookmarks]);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredFormulas = useMemo(() => {
    if (!normalizedQuery) return formulas;
    return formulas.filter((f) => {
      const hay = [
        f.title,
        f.formula_no,
        f.plain_text,
        f.formula_latex,
        f.note,
        f.category_name,
        f.chapter_title,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(normalizedQuery);
    });
  }, [formulas, normalizedQuery]);

  const filteredPosts = useMemo(() => {
    if (!normalizedQuery) return posts;
    return posts.filter((p) => {
      const hay = [
        p.title,
        p.description,
        p.subject,
        p.authorName,
        p.authorUsername,
        ...(Array.isArray(p.tags) ? p.tags : []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(normalizedQuery);
    });
  }, [posts, normalizedQuery]);

  const totalCount = formulas.length + posts.length;
  const visibleFormulas = activeTab === 'posts' ? [] : filteredFormulas;
  const visiblePosts = activeTab === 'formulas' ? [] : filteredPosts;
  const visibleCount = visibleFormulas.length + visiblePosts.length;

  const handleRemoveFormula = async (formulaId: string) => {
    if (removingIds[`f:${formulaId}`]) return;
    const prev = formulas;
    setRemovingIds((s) => ({ ...s, [`f:${formulaId}`]: true }));
    setFormulas((list) => list.filter((item) => item.id !== formulaId));
    try {
      await toggleFormulaBookmark(formulaId);
    } catch {
      setFormulas(prev);
      setError('Could not remove formula bookmark. Please try again.');
    } finally {
      setRemovingIds((s) => {
        const next = { ...s };
        delete next[`f:${formulaId}`];
        return next;
      });
    }
  };

  const handleRemovePost = async (postId: string) => {
    if (!user?.uid || removingIds[`p:${postId}`]) return;
    const prev = posts;
    setRemovingIds((s) => ({ ...s, [`p:${postId}`]: true }));
    setPosts((list) => list.filter((item) => item.id !== postId));
    try {
      await toggleSavePost(postId, user.uid);
    } catch {
      setPosts(prev);
      setError('Could not remove saved post. Please try again.');
    } finally {
      setRemovingIds((s) => {
        const next = { ...s };
        delete next[`p:${postId}`];
        return next;
      });
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto pb-10 space-y-6">
      <PageMeta
        title="Bookmarks — Boardly"
        description="Access your saved Formula Vault sheets and bookmarked Boardly Commons posts in one place."
        canonicalPath="/bookmarks"
        noindex={true}
      />

      {/* Header */}
      <div className="rounded-3xl bg-[var(--card)] border border-[var(--border)] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#D71921]/12 border border-[#D71921]/25 text-[#D71921] flex items-center justify-center shrink-0">
              <Bookmark size={21} />
            </div>
            <div>
              <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[var(--text)] tracking-tight">
                Bookmarks
              </h1>
              <p className="text-sm text-[var(--muted)] mt-0.5">
                Your saved formulas from the Formula Vault and bookmarked study posts from Commons.
              </p>
            </div>
          </div>

          {!isGuest && (
            <button
              type="button"
              onClick={() => void loadBookmarks(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs font-semibold text-[var(--text)] hover:border-[var(--red)]/50 transition-colors cursor-pointer disabled:opacity-50 self-start sm:self-auto"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              <span>{refreshing ? 'Refreshing…' : 'Refresh'}</span>
            </button>
          )}
        </div>

        {/* Tabs & Search */}
        {!isGuest && (
          <div className="mt-5 pt-4 border-t border-[var(--border)] flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="inline-flex items-center gap-1.5 p-1 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] w-fit">
              {(
                [
                  { id: 'all', label: 'All', count: totalCount },
                  { id: 'formulas', label: 'Formulas', count: formulas.length },
                  { id: 'posts', label: 'Commons Posts', count: posts.length },
                ] as const
              ).map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                      active
                        ? 'bg-[#D71921] text-white shadow-sm'
                        : 'text-[var(--muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`font-mono text-[11px] px-1.5 py-0.5 rounded-md ${
                        active ? 'bg-white/20 text-white' : 'bg-[var(--card)] text-[var(--muted)]'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="relative w-full md:w-72">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search saved formulas or posts…"
                aria-label="Search bookmarks"
                className="w-full pl-9 pr-9 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[#D71921]/60 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-2xl bg-[#D71921]/10 border border-[#D71921]/30 px-4 py-3 text-sm text-[var(--text)] flex items-center justify-between gap-3">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-xs font-semibold text-[#D71921] hover:underline cursor-pointer shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Guest prompt */}
      {isGuest ? (
        <div className="rounded-3xl bg-[var(--card)] border border-[var(--border)] p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#D71921]/10 border border-[#D71921]/25 text-[#D71921] flex items-center justify-center mx-auto">
            <UserPlus size={24} />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h2 className="font-heading text-xl font-bold text-[var(--text)]">
              Create an account to save bookmarks
            </h2>
            <p className="text-sm text-[var(--muted)]">
              Bookmarks sync across devices for registered accounts so your saved formulas and
              Commons posts stay with you.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <Link
              to="/signup"
              className="px-5 py-2.5 rounded-xl bg-[#D71921] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Create free account
            </Link>
            <Link
              to="/dashboard/formulas"
              className="px-5 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm font-semibold text-[var(--text)] hover:border-[var(--red)]/50 transition-colors"
            >
              Browse Formula Vault
            </Link>
          </div>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-[var(--card)] border border-[var(--border)] p-5 space-y-3 animate-pulse"
            >
              <div className="h-4 w-28 rounded bg-[var(--surface-2)]" />
              <div className="h-5 w-3/4 rounded bg-[var(--surface-2)]" />
              <div className="h-14 w-full rounded-xl bg-[var(--surface-2)]" />
              <div className="h-3 w-1/2 rounded bg-[var(--surface-2)]" />
            </div>
          ))}
        </div>
      ) : visibleCount === 0 ? (
        <div className="rounded-3xl bg-[var(--card)] border border-[var(--border)] p-8 sm:p-10 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--muted)] flex items-center justify-center mx-auto">
            <Bookmark size={24} />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h2 className="font-heading text-xl font-bold text-[var(--text)]">
              {normalizedQuery ? 'No matching bookmarks' : 'Nothing bookmarked yet'}
            </h2>
            <p className="text-sm text-[var(--muted)]">
              {normalizedQuery
                ? `No saved formulas or posts matched "${searchQuery.trim()}".`
                : 'Bookmark high-yield formulas in the Formula Vault or save helpful study notes in Boardly Commons to find them quickly here.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            {normalizedQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-5 py-2.5 rounded-xl bg-[#D71921] text-white text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer"
              >
                Clear search
              </button>
            ) : (
              <>
                <Link
                  to="/dashboard/formulas"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D71921] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  <Sigma size={16} />
                  <span>Explore Formula Vault</span>
                </Link>
                <Link
                  to="/dashboard/commons"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm font-semibold text-[var(--text)] hover:border-[var(--red)]/50 transition-colors"
                >
                  <BookOpen size={16} />
                  <span>Browse Commons</span>
                </Link>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Saved Formulas Section */}
          {visibleFormulas.length > 0 && (
            <section className="space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sigma size={17} className="text-[#D71921]" />
                  <h2 className="font-heading text-lg font-bold text-[var(--text)]">
                    Saved Formulas
                  </h2>
                  <span className="text-xs font-mono text-[var(--muted)]">
                    ({visibleFormulas.length})
                  </span>
                </div>
                <Link
                  to="/dashboard/formulas"
                  className="text-xs font-semibold text-[#D71921] hover:underline"
                >
                  Open Formula Vault →
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visibleFormulas.map((formula) => {
                  const busy = Boolean(removingIds[`f:${formula.id}`]);
                  return (
                    <article
                      key={formula.id}
                      className="rounded-2xl bg-[var(--card)] border border-[var(--border)] p-5 flex flex-col justify-between gap-4 hover:border-[#D71921]/40 transition-colors"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center flex-wrap gap-1.5 text-[11px] font-mono text-[var(--muted)] mb-1">
                              {formula.category_name && (
                                <span className="px-2 py-0.5 rounded-md bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)]">
                                  {formula.category_name}
                                </span>
                              )}
                              {formula.chapter_title && (
                                <span className="truncate">
                                  {formula.chapter_no ? `Ch. ${formula.chapter_no} · ` : ''}
                                  {formula.chapter_title}
                                </span>
                              )}
                            </div>
                            <h3 className="font-heading text-base font-bold text-[var(--text)] leading-snug">
                              {formula.title}
                            </h3>
                          </div>

                          <button
                            type="button"
                            onClick={() => void handleRemoveFormula(formula.id)}
                            disabled={busy}
                            title="Remove bookmark"
                            aria-label={`Remove ${formula.title} from bookmarks`}
                            className="p-2 rounded-xl text-[var(--muted)] hover:text-[#D71921] hover:bg-[#D71921]/10 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>

                        <div
                          dir="ltr"
                          className="rounded-xl bg-[var(--surface-2)] border border-[var(--border)] px-4 py-3 overflow-x-auto text-[var(--text)]"
                        >
                          {formula.formula_latex ? (
                            <MathText text={`$$${formula.formula_latex}$$`} block />
                          ) : (
                            <p className="font-mono text-sm">{formula.plain_text || formula.title}</p>
                          )}
                        </div>

                        {formula.note && (
                          <p className="text-xs text-[var(--muted)] line-clamp-2 leading-relaxed">
                            {formula.note}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                        <span className="text-[11px] font-mono text-[var(--muted)]">
                          {formula.formula_no ? `#${formula.formula_no}` : 'Formula Vault'}
                        </span>
                        <Link
                          to={`/dashboard/formulas/${encodeURIComponent(formula.id)}`}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D71921] hover:underline"
                        >
                          <span>View in Vault</span>
                          <ExternalLink size={13} />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {/* Saved Commons Posts Section */}
          {visiblePosts.length > 0 && (
            <section className="space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <BookOpen size={17} className="text-[#D71921]" />
                  <h2 className="font-heading text-lg font-bold text-[var(--text)]">
                    Saved Commons Posts
                  </h2>
                  <span className="text-xs font-mono text-[var(--muted)]">
                    ({visiblePosts.length})
                  </span>
                </div>
                <Link
                  to="/dashboard/commons"
                  className="text-xs font-semibold text-[#D71921] hover:underline"
                >
                  Open Commons →
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visiblePosts.map((post) => {
                  const busy = Boolean(removingIds[`p:${post.id}`]);
                  const slugPath = `/commons/post/${encodeURIComponent(
                    buildEntitySlug(post.title || 'post', post.id)
                  )}`;
                  const authorLabel = post.isAnonymous
                    ? 'Anonymous'
                    : post.authorName || (post.authorUsername ? `@${post.authorUsername}` : 'Student');
                  const relTime = formatRelativeDate(post.createdAt);

                  return (
                    <article
                      key={post.id}
                      className="rounded-2xl bg-[var(--card)] border border-[var(--border)] p-5 flex flex-col justify-between gap-4 hover:border-[#D71921]/40 transition-colors"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center flex-wrap gap-1.5 text-[11px] font-mono text-[var(--muted)] mb-1">
                              {post.subject && (
                                <span className="px-2 py-0.5 rounded-md bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] capitalize">
                                  {post.subject}
                                </span>
                              )}
                              <span>{authorLabel}</span>
                              {relTime && <span>· {relTime}</span>}
                            </div>
                            <Link
                              to={slugPath}
                              className="block font-heading text-base font-bold text-[var(--text)] hover:text-[#D71921] transition-colors leading-snug line-clamp-2"
                            >
                              {post.title || 'Untitled Commons Post'}
                            </Link>
                          </div>

                          <button
                            type="button"
                            onClick={() => void handleRemovePost(post.id)}
                            disabled={busy}
                            title="Remove from bookmarks"
                            aria-label={`Remove ${post.title || 'post'} from bookmarks`}
                            className="p-2 rounded-xl text-[var(--muted)] hover:text-[#D71921] hover:bg-[#D71921]/10 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>

                        {post.description && (
                          <p className="text-sm text-[var(--muted)] line-clamp-3 leading-relaxed">
                            {maskPublicUserText(post.description)}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                        <div className="flex items-center gap-3 text-xs font-mono text-[var(--muted)]">
                          <span className="inline-flex items-center gap-1">
                            <ThumbsUp size={13} />
                            {Number(post.upvotes || 0)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MessageSquare size={13} />
                            {Number(post.commentCount || 0)}
                          </span>
                        </div>

                        <Link
                          to={slugPath}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D71921] hover:underline"
                        >
                          <span>Open Post</span>
                          <ExternalLink size={13} />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default BookmarksPage;

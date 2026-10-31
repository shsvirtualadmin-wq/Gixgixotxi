import { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  User,
  BookOpen,
  ArrowRight,
  Clock,
  Trash2,
  FileText,
  EyeOff,
  Globe,
  ChevronRight,
} from 'lucide-react';
import type { CommonsPost, CommonsUserPreview } from '@/types/commons';
import { COMMONS_POST_TYPES } from '@/types/commons';
import { searchPeople, fetchCommonsPosts } from '@/services/commonsService';
import { useProfileModal } from '@/contexts/ProfileModalContext';
import { BoardlyAvatar } from '@/components/ui/BoardlyAvatar';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { sanitizeStudentDisplayName } from '@/utils/privacy';
import { useTheme } from '@/hooks/useTheme';
import { LineLoader } from '@/components/ui/LineLoader';

interface CommonsSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  posts: CommonsPost[];
  currentUserId?: string | null;
  onSelectPost: (post: CommonsPost) => void;
  onOpenComments: (post: CommonsPost) => void;
  onOpenReport: (post: CommonsPost) => void;
  onOpenUserProfile?: (uid: string) => void;
}

const RECENT_SEARCHES_KEY = 'boardly_commons_recent_searches';

export function CommonsSearchModal({
  isOpen,
  onClose,
  posts: initialFeedPosts,
  currentUserId,
  onSelectPost,
  onOpenComments,
  onOpenReport,
  onOpenUserProfile,
}: CommonsSearchModalProps) {
  const { openProfile } = useProfileModal();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'posts' | 'people'>('posts');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Results & status
  const [postResults, setPostResults] = useState<CommonsPost[]>([]);
  const [peopleResults, setPeopleResults] = useState<CommonsUserPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const searchSeqRef = useRef<number>(0);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.slice(0, 5));
        }
      }
    } catch {
      // ignore storage parsing error
    }
  }, [isOpen]);

  // Save query to recent searches
  const saveRecentSearch = (queryStr: string) => {
    const trimmed = queryStr.trim();
    if (trimmed.length < 2) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 5);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch (err) {
        console.debug('[CommonsSearchModal] local storage write skipped:', err);
      }
      return updated;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (err) {
      console.debug('[CommonsSearchModal] local storage clear skipped:', err);
    }
  };

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 80);
    } else {
      setSearchQuery('');
      setDebouncedQuery('');
      setPostResults([]);
      setPeopleResults([]);
    }
  }, [isOpen]);

  // Debounce query (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Perform search with sequence ID to prevent race conditions
  useEffect(() => {
    if (!isOpen) return;

    if (debouncedQuery.length < 2) {
      setPostResults([]);
      setPeopleResults([]);
      setLoading(false);
      return;
    }

    const currentSeq = ++searchSeqRef.current;
    setLoading(true);

    const tokens = debouncedQuery.toLowerCase().split(/\s+/);

    // 1. Client filter on loaded feed posts
    const clientPostMatches = initialFeedPosts.filter((p) => {
      const text = `${p.title || ''} ${p.description || ''} ${p.subject || ''} ${p.chapter || ''} ${p.target || ''} ${(p.tags || []).join(' ')} ${p.isAnonymous ? '' : p.authorName || ''}`.toLowerCase();
      return tokens.every((token) => text.includes(token));
    });

    // 2. Fetch server matches & search people in parallel
    Promise.all([
      fetchCommonsPosts({ searchQuery: debouncedQuery, pageSize: 20, currentUid: currentUserId })
        .then((res) => res.posts)
        .catch(() => [] as CommonsPost[]),
      searchPeople(debouncedQuery).catch(() => [] as CommonsUserPreview[]),
    ])
      .then(([serverPosts, people]) => {
        if (currentSeq !== searchSeqRef.current) return;

        // Deduplicate post results by ID
        const postMap = new Map<string, CommonsPost>();
        clientPostMatches.forEach((p) => postMap.set(p.id, p));
        serverPosts.forEach((p) => postMap.set(p.id, p));

        setPostResults(Array.from(postMap.values()));
        setPeopleResults(people);
      })
      .catch((err) => {
        if (currentSeq !== searchSeqRef.current) return;
        console.warn('[CommonsSearchModal] search error:', err);
      })
      .finally(() => {
        if (currentSeq === searchSeqRef.current) {
          setLoading(false);
        }
      });
  }, [debouncedQuery, initialFeedPosts, currentUserId, isOpen]);

  if (!isOpen) return null;

  const hasQuery = debouncedQuery.length >= 2;

  const formatTime = (ts: any) => {
    if (!ts) return 'Just now';
    try {
      const date = ts?.toDate ? ts.toDate() : new Date(ts);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
      if (searchQuery.trim().length >= 2) {
        saveRecentSearch(searchQuery);
      }
    }
  };

  const handleSelectRecent = (term: string) => {
    setSearchQuery(term);
    setDebouncedQuery(term);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center pt-3 sm:pt-14 px-3 sm:px-4 bg-black/60 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-[28px] glass-panel allow-backdrop-blur text-primary flex flex-col max-h-[88vh] overflow-hidden"
      >
        {/* Search Input Bar */}
        <div className="p-3.5 sm:p-4 border-b border-[var(--glass-border)] space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl glass-row focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition-all">
              <Search size={18} className="text-muted shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search Commons"
                className="flex-1 text-base sm:text-sm bg-transparent border-none text-primary placeholder:text-muted focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setDebouncedQuery('');
                    inputRef.current?.focus();
                  }}
                  className="p-1 rounded-full text-muted hover:text-primary transition-colors cursor-pointer"
                  title="Clear input"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full glass-pill flex items-center justify-center text-muted hover:text-primary transition-colors cursor-pointer shrink-0"
              title="Close search"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search Tabs: Posts vs People (Counts shown only when there is a query) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'posts'
                  ? 'bg-accent-soft text-accent border border-accent/30 font-bold'
                  : 'text-muted hover:text-primary hover:bg-surface-muted border border-transparent'
              }`}
            >
              <BookOpen size={13} />
              <span>{hasQuery ? `Posts (${postResults.length})` : 'Posts'}</span>
            </button>

            <button
              onClick={() => setActiveTab('people')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'people'
                  ? 'bg-accent-soft text-accent border border-accent/30 font-bold'
                  : 'text-muted hover:text-primary hover:bg-surface-muted border border-transparent'
              }`}
            >
              <User size={13} />
              <span>{hasQuery ? `People (${peopleResults.length})` : 'People'}</span>
            </button>
          </div>
        </div>

        {/* Results / Empty / Loading Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Case 1: Empty box (< 2 chars) */}
          {!hasQuery ? (
            <div className="py-8 px-4 text-center space-y-5">
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-surface-muted border border-border flex items-center justify-center mx-auto text-muted">
                  <Search size={24} />
                </div>
                <h3 className="text-base font-bold text-primary">Search Commons</h3>
                <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed">
                  Find study material, formulas, past papers, doubts or classmates.
                </p>
              </div>

              {/* Recent searches */}
              {recentSearches.length > 0 && (
                <div className="pt-2 text-left max-w-md mx-auto">
                  <div className="flex items-center justify-between text-xs text-muted mb-2 px-1">
                    <span className="font-semibold flex items-center gap-1.5">
                      <Clock size={12} /> Recent searches
                    </span>
                    <button
                      onClick={clearRecentSearches}
                      className="text-muted hover:text-accent cursor-pointer text-[11px]"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term, i) => (
                      <button
                        key={i}
                        onClick={() => handleSelectRecent(term)}
                        className="px-3 py-1.5 rounded-xl text-xs bg-surface-muted hover:bg-surface-raised border border-border text-secondary hover:text-primary transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <span>{term}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : loading ? (
            /* Case 2: Loading */
            <div className="py-8">
              <LineLoader
                variant="section"
                context="generic"
                message={`Searching for "${debouncedQuery}"...`}
              />
            </div>
          ) : activeTab === 'posts' ? (
            /* Case 3: Posts Tab Results */
            postResults.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <p className="text-sm font-semibold text-primary">
                  No results for "{debouncedQuery}"
                </p>
                <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed">
                  Try checking your spelling, using fewer keywords, or searching by author name or topic.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {postResults.map((post) => {
                  const typeMeta =
                    COMMONS_POST_TYPES[post.type] || COMMONS_POST_TYPES.notes;
                  const authorIsSuperAdmin =
                    (post as any).authorRole === 'superadmin' ||
                    (post as any).authorRole === 'admin' ||
                    post.authorUid === 'A5YMRimdHRcmeDWutxtUGt2e4hf2';

                  return (
                    <div
                      key={post.id}
                      onClick={() => {
                        saveRecentSearch(debouncedQuery);
                        onClose();
                        onOpenComments(post);
                      }}
                      className="boardly-post-card p-3.5 rounded-xl border border-border bg-surface hover:border-border-strong hover:bg-surface-muted/60 transition-all cursor-pointer group space-y-1.5 w-full max-w-full min-w-0 box-border overflow-x-hidden"
                    >
                      {/* Top row: Type Pill & Time */}
                      <div className="flex items-center justify-between text-xs text-muted min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-surface-muted border border-border text-secondary shrink-0">
                            {typeMeta.badgeLabel}
                          </span>
                          {post.subject && (
                            <span className="text-muted font-medium truncate max-w-[150px]">
                              {post.subject}
                            </span>
                          )}
                        </div>
                        <span className="shrink-0">{formatTime(post.createdAt)}</span>
                      </div>

                      {/* Title: Bold */}
                      <h4 className="boardly-post-title text-sm font-bold text-primary group-hover:text-accent transition-colors line-clamp-1 min-w-0 max-w-full [overflow-wrap:anywhere] [word-break:break-word]">
                        {post.title}
                      </h4>

                      {/* Short 1-line preview */}
                      {post.description && (
                        <p className="boardly-post-content text-xs text-secondary line-clamp-1 leading-relaxed min-w-0 max-w-full [overflow-wrap:anywhere] [word-break:break-word]">
                          {post.description}
                        </p>
                      )}

                      {/* Bottom line: Author with role badge */}
                      <div className="flex items-center justify-between pt-1 text-xs text-muted min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {post.isAnonymous ? (
                            <span className="flex items-center gap-1 font-medium text-muted">
                              <EyeOff size={12} /> Anonymous
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-semibold text-primary truncate">
                                {sanitizeStudentDisplayName(
                                  post.authorName,
                                  post.authorUid
                                )}
                              </span>
                              <RoleBadge
                                role={(post as any).authorRole || 'Student'}
                                customRole={(post as any).authorCustomRole}
                                isSuperAdmin={authorIsSuperAdmin}
                                size="sm"
                              />
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] text-accent font-semibold group-hover:underline flex items-center gap-0.5 shrink-0">
                          <span>View post</span>
                          <ChevronRight size={12} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : /* Case 4: People Tab Results */
          peopleResults.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-sm font-semibold text-primary">
                No results for "{debouncedQuery}"
              </p>
              <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed">
                Try searching by first name, nickname, or username.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {peopleResults.map((u) => (
                <div
                  key={u.uid}
                  onClick={() => {
                    saveRecentSearch(debouncedQuery);
                    onClose();
                    if (onOpenUserProfile) {
                      onOpenUserProfile(u.uid);
                    } else {
                      openProfile(u.uid);
                    }
                  }}
                  className="flex items-center justify-between py-3 px-2 hover:bg-surface-muted rounded-xl transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <BoardlyAvatar
                      equippedAvatar={u.equippedAvatar}
                      avatarUrl={u.avatarUrl}
                      photoURL={u.photoURL}
                      frame={u.frame}
                      name={u.displayName}
                      size={38}
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-primary group-hover:text-accent transition-colors truncate">
                          {u.displayName}
                        </span>
                        <RoleBadge
                          role={u.role || 'Student'}
                          customRole={u.customRole}
                          isSuperAdmin={u.isSuperAdmin}
                          size="sm"
                        />
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted mt-0.5">
                        {u.username && (
                          <span className="font-mono text-muted">@{u.username}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <ArrowRight
                    size={16}
                    className="text-muted group-hover:text-accent group-hover:translate-x-1 transition-all shrink-0 ml-2"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

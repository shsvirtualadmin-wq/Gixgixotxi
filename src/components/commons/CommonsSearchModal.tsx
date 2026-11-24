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
import { Link } from 'react-router-dom';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { ProBadge } from '@/components/ui/ProBadge';
import { PlusBadge } from '@/components/ui/PlusBadge';
import { sanitizeStudentDisplayName, buildEntitySlug } from '@/utils/privacy';
import { formatRelativeTimePkt, useSharedNow } from '@/utils/dateFormat';
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
  const nowMs = useSharedNow();
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

  const [segStretching, setSegStretching] = useState(false);
  const triggerSegStretch = () => {
    setSegStretching(false);
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        setSegStretching(true);
        window.setTimeout(() => setSegStretching(false), 475);
      });
    }
  };

  if (!isOpen) return null;

  const hasQuery = debouncedQuery.length >= 2;

  const formatTime = (ts: any) => formatRelativeTimePkt(ts, nowMs);

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
    saveRecentSearch(term);
  };

  const TRY_SUGGESTIONS = [
    'Quadratic equations',
    "Newton's laws",
    'MDCAT Biology',
    'Electrochemistry',
    'Organic Chemistry',
    'Solved Past Papers',
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center pt-3 sm:pt-12 px-3 sm:px-4 overlay-blur bg-black/65 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-[34px] glass glass-panel text-primary flex flex-col max-h-[88vh] overflow-hidden"
      >
        {/* Glass Pill Search Bar with Red Focus Ring + Cancel */}
        <div className="p-4 sm:p-5 space-y-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex-1 flex items-center gap-2.5 px-4 min-h-[50px] rounded-full bg-white/[0.07] border border-white/[0.18] focus-within:border-[#D71921] focus-within:ring-2 focus-within:ring-[#D71921]/40 transition-all">
              <Search size={18} className="text-[#D71921] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search Commons..."
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
                  className="w-7 h-7 rounded-full bg-white/[0.08] flex items-center justify-center text-muted hover:text-primary transition-colors cursor-pointer"
                  title="Clear input"
                  aria-label="Clear search query"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="min-h-[48px] px-4 rounded-full glass-pill flex items-center justify-center text-xs sm:text-sm font-semibold text-muted hover:text-primary transition-colors cursor-pointer shrink-0"
              title="Cancel search"
            >
              Cancel
            </button>
          </div>

          {/* Segmented Control in a Glass Track: Posts vs People */}
          <div
            role="tablist"
            aria-label="Search category"
            className="ios-seg-track w-full grid grid-cols-2 items-center"
          >
            <div
              aria-hidden="true"
              className="ios-seg-thumb"
              style={{
                width: 'calc((100% - 8px) / 2)',
                transform:
                  activeTab === 'people'
                    ? 'translate3d(100%, 0, 0)'
                    : 'translate3d(0%, 0, 0)',
              }}
            >
              <div className={`ios-seg-thumb-inner ${segStretching ? 'is-stretching' : ''}`} />
            </div>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'posts'}
              onClick={() => {
                if (activeTab !== 'posts') triggerSegStretch();
                setActiveTab('posts');
              }}
              className={`ios-seg-btn gap-1.5 ${activeTab === 'posts' ? 'is-active' : ''}`}
            >
              <BookOpen size={14} />
              <span>{hasQuery ? `Posts (${postResults.length})` : 'Posts'}</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'people'}
              onClick={() => {
                if (activeTab !== 'people') triggerSegStretch();
                setActiveTab('people');
              }}
              className={`ios-seg-btn gap-1.5 ${activeTab === 'people' ? 'is-active' : ''}`}
            >
              <User size={14} />
              <span>{hasQuery ? `People (${peopleResults.length})` : 'People'}</span>
            </button>
          </div>

          <div className="dotted-divider" aria-hidden="true" />
        </div>

        {/* Results / Empty / Loading Area */}
        <div className="flex-1 overflow-y-auto px-4 pb-5 sm:px-5 space-y-3">
          {/* Case 1: Empty box (< 2 chars) */}
          {!hasQuery ? (
            <div className="py-4 px-2 text-center space-y-6">
              <div className="space-y-2">
                <div className="w-14 h-14 rounded-full glass-pill flex items-center justify-center mx-auto text-[#D71921] shadow-[0_0_24px_rgba(215,25,33,0.22)]">
                  <Search size={24} />
                </div>
                <h3
                  className="text-xl sm:text-2xl text-primary tracking-tight"
                  style={{ fontFamily: "'Doto', var(--font-dot), monospace", fontWeight: 800 }}
                >
                  Search Commons
                </h3>
                <p className="text-xs sm:text-sm text-muted max-w-sm mx-auto leading-relaxed">
                  Find study material, formulas, past papers, doubts or classmates.
                </p>
              </div>

              {/* RECENT searches chips + Clear */}
              {recentSearches.length > 0 && (
                <div className="text-left max-w-lg mx-auto space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <span
                      className="text-[11px] uppercase tracking-[0.14em] text-muted flex items-center gap-1.5"
                      style={{ fontFamily: "'Doto', var(--font-dot), monospace", fontWeight: 800 }}
                    >
                      <Clock size={12} className="text-[#D71921]" /> RECENT
                    </span>
                    <button
                      type="button"
                      onClick={clearRecentSearches}
                      className="min-h-[32px] px-2.5 rounded-full text-muted hover:text-[#D71921] cursor-pointer text-xs font-semibold transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectRecent(term)}
                        className="min-h-[44px] px-4 py-2 rounded-full text-xs font-semibold glass-pill text-secondary hover:text-primary hover:border-[#D71921]/45 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Clock size={12} className="text-muted shrink-0" />
                        <span>{term}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TRY suggestion chips */}
              <div className="text-left max-w-lg mx-auto space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <span
                    className="text-[11px] uppercase tracking-[0.14em] text-muted flex items-center gap-1.5"
                    style={{ fontFamily: "'Doto', var(--font-dot), monospace", fontWeight: 800 }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D71921]" /> TRY
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {TRY_SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleSelectRecent(suggestion)}
                      className="min-h-[44px] px-4 py-2 rounded-full text-xs font-semibold glass-pill text-secondary hover:text-primary hover:border-[#D71921]/45 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Search size={12} className="text-[#D71921] shrink-0" />
                      <span>{suggestion}</span>
                    </button>
                  ))}
                </div>
              </div>
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
                <p
                  className="text-base text-primary"
                  style={{ fontFamily: "'Doto', var(--font-dot), monospace", fontWeight: 800 }}
                >
                  No results for "{debouncedQuery}"
                </p>
                <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed">
                  Try checking your spelling, using fewer keywords, or searching by author name or topic.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 stagger-list">
                {postResults.map((post) => {
                  const typeMeta =
                    COMMONS_POST_TYPES[post.type] || COMMONS_POST_TYPES.notes;
                  const authorIsSuperAdmin =
                    (post as any).authorRole === 'superadmin' ||
                    (post as any).authorRole === 'admin' ||
                    post.authorUid === 'A5YMRimdHRcmeDWutxtUGt2e4hf2';

                  const postUrl = `/commons/post/${buildEntitySlug(post.id, post.title)}`;
                  return (
                    <Link
                      key={post.id}
                      to={postUrl}
                      onClick={() => {
                        saveRecentSearch(debouncedQuery);
                        onClose();
                        onSelectPost(post);
                      }}
                      className="block boardly-post-card p-3.5 rounded-xl border border-border bg-surface hover:border-border-strong hover:bg-surface-muted/60 transition-all cursor-pointer group space-y-1.5 w-full max-w-full min-w-0 box-border overflow-x-hidden"
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
                    </Link>
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
                      uid={u.uid}
                      equippedAvatar={u.equippedAvatar}
                      frame={u.frame}
                      name={u.displayName}
                      size={38}
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-primary group-hover:text-accent transition-colors truncate">
                          {u.displayName}
                        </span>
                        {typeof u.plusBadge === 'number' ? (
                          <PlusBadge id={u.plusBadge} size="sm" listMode />
                        ) : u.proBadge ? (
                          <ProBadge design={u.proBadge} size="sm" listMode />
                        ) : null}
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

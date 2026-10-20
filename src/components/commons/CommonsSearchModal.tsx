import { useState, useEffect } from 'react';
import { Search, X, User, BookOpen, Flame, ArrowRight } from 'lucide-react';
import type { CommonsPost, CommonsUserPreview } from '@/types/commons';
import { searchPeople } from '@/services/commonsService';
import { CommonsPostCard } from './CommonsPostCard';

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

export function CommonsSearchModal({
  isOpen,
  onClose,
  posts,
  currentUserId,
  onSelectPost,
  onOpenComments,
  onOpenReport,
  onOpenUserProfile,
}: CommonsSearchModalProps) {
  const [activeTab, setActiveTab] = useState<'posts' | 'people'>('posts');
  const [searchQuery, setSearchQuery] = useState('');
  const [peopleResults, setPeopleResults] = useState<CommonsUserPreview[]>([]);
  const [loadingPeople, setLoadingPeople] = useState(false);

  useEffect(() => {
    if (activeTab === 'people' && searchQuery.trim().length >= 2) {
      setLoadingPeople(true);
      const timer = setTimeout(() => {
        searchPeople(searchQuery)
          .then(setPeopleResults)
          .finally(() => setLoadingPeople(false));
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setPeopleResults([]);
    }
  }, [activeTab, searchQuery]);

  if (!isOpen) return null;

  // Filter posts client-side for immediate feedback
  const filteredPosts = posts.filter((p) => {
    if (!searchQuery.trim()) return true;
    const tokens = searchQuery.toLowerCase().trim().split(/\s+/);
    const text = `${p.title} ${p.description} ${p.subject} ${p.chapter} ${p.target} ${p.tags.join(' ')}`.toLowerCase();
    return tokens.every((t) => text.includes(t));
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-14 p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl rounded-2xl border border-neutral-800 bg-[#0c0c0e] shadow-2xl flex flex-col max-h-[82vh] overflow-hidden">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-neutral-800 bg-neutral-900/40">
          <div className="flex items-center gap-2.5">
            <Search size={18} className="text-red-500 shrink-0" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search study material, formulas, past papers, or classmates..."
              className="flex-1 text-sm bg-transparent border-none text-neutral-100 placeholder:text-neutral-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 rounded text-neutral-500 hover:text-neutral-300"
              >
                <X size={16} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search Tabs: Posts vs People */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-neutral-800/80">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'posts'
                  ? 'bg-red-950/60 text-red-300 border border-red-800/60'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
            >
              <BookOpen size={13} />
              <span>Posts ({filteredPosts.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('people')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'people'
                  ? 'bg-red-950/60 text-red-300 border border-red-800/60'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
            >
              <User size={13} />
              <span>People</span>
            </button>
          </div>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeTab === 'posts' ? (
            filteredPosts.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-400 font-mono">
                No matching posts found. Try another keyword or subject.
              </div>
            ) : (
              filteredPosts.map((post) => (
                <CommonsPostCard
                  key={post.id}
                  post={post}
                  currentUserId={currentUserId}
                  onOpenComments={onOpenComments}
                  onOpenReport={onOpenReport}
                />
              ))
            )
          ) : (
            <div>
              {loadingPeople ? (
                <div className="py-10 text-center text-xs text-neutral-500 font-mono">
                  Searching classmates...
                </div>
              ) : searchQuery.trim().length < 2 ? (
                <div className="py-10 text-center text-xs text-neutral-500 font-mono">
                  Type at least 2 characters to search students by name.
                </div>
              ) : peopleResults.length === 0 ? (
                <div className="py-10 text-center text-xs text-neutral-400 font-mono">
                  No students found matching "{searchQuery}".
                </div>
              ) : (
                <div className="divide-y divide-neutral-800/80">
                  {peopleResults.map((u) => (
                    <div
                      key={u.uid}
                      onClick={() => {
                        onClose();
                        onOpenUserProfile?.(u.uid);
                      }}
                      className="flex items-center justify-between py-3 px-2 hover:bg-neutral-900/60 rounded-xl transition-colors cursor-pointer group"
                      title="View student profile"
                    >
                      <div className="flex items-center gap-3">
                        {u.avatarUrl ? (
                          <img
                            src={u.avatarUrl}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover border border-neutral-700"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-red-950/50 border border-red-800/60 flex items-center justify-center text-xs font-bold text-red-400">
                            {u.displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="text-xs font-semibold text-neutral-200">
                            {u.displayName}
                          </div>
                          <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                            {u.targetUniversity && (
                              <span>Target: {u.targetUniversity}</span>
                            )}
                            {u.streak ? (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="flex items-center gap-0.5 text-amber-400 font-mono">
                                  <Flame size={11} /> {u.streak}d streak
                                </span>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

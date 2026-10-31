import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BookOpen, ArrowRight, AlertTriangle, RefreshCw } from 'lucide-react';
import { PageMeta } from '@/components/ui/PageMeta';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { LineLoader } from '@/components/ui/LineLoader';
import { CommonsPostCard } from '@/components/commons/CommonsPostCard';
import { CommonsCommentsDrawer } from '@/components/commons/CommonsCommentsDrawer';
import { CommonsReportModal } from '@/components/commons/CommonsReportModal';
import { fetchCommonsPosts } from '@/services/commonsService';
import { formatSubjectName } from '@/constants/taxonomy';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { routes, resolveValidMcqSubject } from '@/utils/routes';
import type { CommonsPost } from '@/types/commons';

export const CommonsSubjectPage: React.FC = () => {
  const { subject = 'physics' } = useParams<{ subject: string }>();
  const isGeneralOrAll = ['general', 'all'].includes(subject.trim().toLowerCase());
  const resolvedPractice = resolveValidMcqSubject(subject);
  const subjectTitle = isGeneralOrAll ? 'All Subjects' : formatSubjectName(subject);
  const { user, isAdmin } = useAuth();
  const { profile } = useUserProfile();

  const [posts, setPosts] = useState<CommonsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [commentsPost, setCommentsPost] = useState<CommonsPost | null>(null);
  const [reportPost, setReportPost] = useState<CommonsPost | null>(null);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await fetchCommonsPosts({ feedTab: 'all', pageSize: 30, currentUid: user?.uid });
      if (isGeneralOrAll) {
        setPosts(res.posts);
      } else {
        const cleanSlug = (resolvedPractice.subjectSlug || subject).toLowerCase().replace(/-/g, ' ');
        const filtered = res.posts.filter((p) => {
          const s = (p.subject || '').toLowerCase();
          const inferred = resolveValidMcqSubject(
            p.subject,
            `${p.title || ''} ${p.chapter || ''} ${(p.tags || []).join(' ')}`
          );
          return (
            s.includes(cleanSlug) ||
            cleanSlug.includes(s) ||
            inferred.subjectSlug === resolvedPractice.subjectSlug ||
            (p.tags || []).some((t) => t.toLowerCase().includes(cleanSlug))
          );
        });
        setPosts(filtered);
      }
    } catch {
      setLoadError(true);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [subject, isGeneralOrAll, resolvedPractice.subjectSlug, user?.uid]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  return (
    <div className="min-h-screen w-full max-w-full min-w-0 box-border overflow-x-hidden bg-[var(--bg)] text-[var(--text)] pt-28 pb-[calc(96px+env(safe-area-inset-bottom,0px))] px-4 sm:px-6">
      <PageMeta
        title={`${subjectTitle} Notes, Past Papers & Discussions — Boardly Commons`}
        description={`Browse student-shared ${subjectTitle} notes, solved past papers, formula sheets, and exam doubts for Class 11, Class 12, MDCAT, and ECAT on Boardly Commons.`}
        canonicalPath={`/commons/subject/${subject}`}
      />

      <div className="boardly-feed-container max-w-3xl mx-auto w-full min-w-0 box-border overflow-x-hidden">
        <Breadcrumbs
          items={[
            { label: 'Commons', href: '/commons' },
            { label: `${subjectTitle} Feed` },
          ]}
        />

        <div className="glass-panel p-6 sm:p-9 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full max-w-full min-w-0 box-border overflow-x-hidden">
          <div className="min-w-0">
            <div className="section-chip-red mb-3">
              <BookOpen size={13} />
              <span>Subject Community</span>
            </div>
            <h1 className="font-dot text-2xl sm:text-4xl font-bold text-white mb-2 [overflow-wrap:anywhere] [word-break:break-word]">
              {subjectTitle} in Boardly Commons
            </h1>
            <p className="text-sm text-white/70 [overflow-wrap:anywhere] [word-break:break-word]">
              Peer-shared notes, solved board papers, and question discussions for {subjectTitle}.
            </p>
          </div>
          <Link
            to={routes.mcqs(subject)}
            className="btn-primary px-5 py-2.5 text-xs font-semibold inline-flex items-center gap-2 shrink-0"
          >
            <span>Practice {resolvedPractice.label} MCQs</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <LineLoader context="dashboard" variant="section" />
        ) : loadError ? (
          <div className="glass-panel p-10 text-center">
            <AlertTriangle size={28} className="text-[#D71921] mx-auto mb-3" />
            <h2 className="font-dot text-xl font-bold text-white mb-2">
              Could not load {subjectTitle} posts
            </h2>
            <p className="text-xs text-white/60 mb-6">
              Please check your connection and try again.
            </p>
            <button
              type="button"
              onClick={() => void loadPosts()}
              className="btn-primary px-5 py-2.5 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="glass-panel p-10 text-center">
            <BookOpen size={28} className="text-white/40 mx-auto mb-3" />
            <h2 className="font-dot text-xl font-bold text-white mb-2">
              No {subjectTitle} posts yet
            </h2>
            <p className="text-xs text-white/60 mb-6">
              Be the first student to share {subjectTitle} notes, formula sheets, or ask a question in Boardly Commons.
            </p>
            <Link to="/commons" className="btn-primary px-5 py-2.5 text-xs font-semibold">
              Open All Commons Posts
            </Link>
          </div>
        ) : (
          <div className="boardly-feed-container space-y-4 w-full max-w-full min-w-0 box-border overflow-x-hidden">
            {posts.map((post) => (
              <CommonsPostCard
                key={post.id}
                post={post}
                currentUserId={user?.uid}
                isAdmin={isAdmin}
                onOpenComments={(p) => setCommentsPost(p)}
                onOpenReport={(p) => setReportPost(p)}
              />
            ))}
          </div>
        )}
      </div>

      <CommonsCommentsDrawer
        post={commentsPost}
        isOpen={Boolean(commentsPost)}
        onClose={() => setCommentsPost(null)}
        currentUser={
          user
            ? {
                uid: user.uid,
                displayName: profile?.displayName || user.displayName,
                photoURL: profile?.photoURL || user.photoURL,
              }
            : null
        }
      />

      <CommonsReportModal
        post={reportPost}
        isOpen={Boolean(reportPost)}
        onClose={() => setReportPost(null)}
        reporterUid={user?.uid || null}
      />
    </div>
  );
};

export default CommonsSubjectPage;

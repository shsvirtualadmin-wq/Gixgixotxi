import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { FolderOpen, Download, ArrowRight, FileText, AlertTriangle, RefreshCw } from 'lucide-react';
import { PageMeta } from '@/components/ui/PageMeta';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { LineLoader } from '@/components/ui/LineLoader';
import { fetchCommonsPosts } from '@/services/commonsService';
import { formatSubjectName } from '@/constants/taxonomy';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthGate } from '@/contexts/AuthGateContext';
import { sanitizeStudentDisplayName, maskPublicUserText, buildEntitySlug } from '@/utils/privacy';
import { routes, resolveValidMcqSubject } from '@/utils/routes';
import type { CommonsPost } from '@/types/commons';
import { COMMONS_POST_TYPES } from '@/types/commons';

export const MaterialSubjectPage: React.FC = () => {
  const { subject = 'physics' } = useParams<{ subject: string }>();
  const location = useLocation();
  const basePrefix: '/material' | '/study-material' = location.pathname.startsWith('/study-material')
    ? '/study-material'
    : '/material';
  const isGeneralOrAll = ['general', 'all'].includes(subject.trim().toLowerCase());
  const resolvedPractice = resolveValidMcqSubject(subject);
  const subjectTitle = isGeneralOrAll ? 'All Subjects' : formatSubjectName(subject);
  const { user } = useAuth();
  const { requireAuth } = useAuthGate();

  const [materials, setMaterials] = useState<CommonsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const loadMaterials = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await fetchCommonsPosts({ feedTab: 'all', pageSize: 40, currentUid: user?.uid });
      if (isGeneralOrAll) {
        setMaterials(res.posts);
      } else {
        const cleanSub = (resolvedPractice.subjectSlug || subject).toLowerCase().replace(/-/g, ' ');
        const filtered = res.posts.filter((p) => {
          const s = (p.subject || '').toLowerCase();
          const inferred = resolveValidMcqSubject(
            p.subject,
            `${p.title || ''} ${p.chapter || ''} ${(p.tags || []).join(' ')}`
          );
          return (
            s.includes(cleanSub) ||
            cleanSub.includes(s) ||
            inferred.subjectSlug === resolvedPractice.subjectSlug ||
            (p.tags || []).some((t) => t.toLowerCase().includes(cleanSub))
          );
        });
        setMaterials(filtered);
      }
    } catch {
      setLoadError(true);
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  }, [subject, isGeneralOrAll, resolvedPractice.subjectSlug, user?.uid]);

  useEffect(() => {
    void loadMaterials();
  }, [loadMaterials]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pt-28 pb-24 px-4 sm:px-6">
      <PageMeta
        title={`${subjectTitle} Study Material, Notes & Past Papers — Boardly`}
        description={`Browse free Class 11 & 12 ${subjectTitle} handwritten notes, formula sheets, and solved board past papers on Boardly.`}
        canonicalPath={`${basePrefix}/subject/${subject}`}
      />

      <div className="max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { label: 'Study Material', href: basePrefix },
            { label: `${subjectTitle} Material` },
          ]}
        />

        <div className="glass-panel p-8 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="section-chip-red mb-3">
              <FolderOpen size={13} />
              <span>Subject Study Library</span>
            </div>
            <h1 className="font-dot text-3xl sm:text-4xl font-bold text-white mb-2">
              {subjectTitle} Study Material &amp; Notes
            </h1>
            <p className="text-sm text-white/70">
              Preview {subjectTitle} notes, formula sheets, and past papers publicly. Sign in to download full files.
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
          <LineLoader context="generic" variant="section" />
        ) : loadError ? (
          <div className="glass-panel p-10 text-center">
            <AlertTriangle size={28} className="text-[#D71921] mx-auto mb-3" />
            <h2 className="font-dot text-xl font-bold text-white mb-2">
              Could not load {subjectTitle} study materials
            </h2>
            <p className="text-xs text-white/60 mb-6">
              Please check your connection and try again.
            </p>
            <button
              type="button"
              onClick={() => void loadMaterials()}
              className="btn-primary px-5 py-2.5 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        ) : materials.length === 0 ? (
          <div className="glass-panel p-10 text-center">
            <FileText size={28} className="text-white/40 mx-auto mb-3" />
            <h2 className="font-dot text-xl font-bold text-white mb-2">
              No {subjectTitle} study materials uploaded yet
            </h2>
            <p className="text-xs text-white/60 mb-6">
              Explore all study materials or practice {resolvedPractice.label} chapters right away.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to={basePrefix} className="btn-primary px-5 py-2.5 text-xs font-semibold">
                All Study Material
              </Link>
              <Link
                to={routes.mcqs(subject)}
                className="btn-secondary px-5 py-2.5 text-xs font-semibold"
              >
                {resolvedPractice.label} Chapters
              </Link>
            </div>
          </div>
        ) : (
          <div className="boardly-feed-container grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-full min-w-0 box-border overflow-x-hidden">
            {materials.map((item) => {
              const slug = buildEntitySlug(item.id, item.title);
              const typeMeta = COMMONS_POST_TYPES[item.type] || COMMONS_POST_TYPES.notes;
              const firstFile = item.files?.[0];
              const authorLabel = item.isAnonymous
                ? item.anonymousAlias || 'Anonymous Student'
                : sanitizeStudentDisplayName(item.authorName, item.authorUid);

              return (
                <div key={item.id} className="boardly-post-card glass-card p-5 sm:p-6 flex flex-col justify-between gap-4 w-full max-w-full min-w-0 box-border overflow-x-hidden">
                  <div className="min-w-0">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#D71921] block mb-1.5">
                      {typeMeta.badgeLabel}
                    </span>
                    <Link
                      to={`/material/${slug}`}
                      className="boardly-post-title font-dot text-lg font-bold text-white hover:text-[#D71921] transition-colors block mb-2 min-w-0 max-w-full [overflow-wrap:anywhere] [word-break:break-word]"
                    >
                      {item.title}
                    </Link>
                    <p className="boardly-post-content text-xs text-white/65 line-clamp-2 min-w-0 max-w-full [overflow-wrap:anywhere] [word-break:break-word]">
                      {maskPublicUserText(item.description)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/[0.08] min-w-0">
                    <span className="text-[11px] text-white/50 truncate min-w-0">By {authorLabel}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        to={`/material/${slug}`}
                        className="btn-secondary px-3 py-1.5 text-xs font-semibold"
                      >
                        Details
                      </Link>
                      {firstFile && (
                        <button
                          type="button"
                          onClick={() =>
                            requireAuth('download this study material', () => {
                              window.open(firstFile.url, '_blank', 'noopener,noreferrer');
                            })
                          }
                          className="btn-primary px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
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

export default MaterialSubjectPage;

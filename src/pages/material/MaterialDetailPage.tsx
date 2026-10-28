import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileText,
  Download,
  Share2,
  Flag,
  Check,
  BookOpen,
  Eye,
  Lock,
} from 'lucide-react';
import { PageMeta } from '@/components/ui/PageMeta';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CommonsImageAttachment } from '@/components/commons/CommonsImageAttachment';
import { CommonsImageViewerModal } from '@/components/commons/CommonsImageViewerModal';
import { CommonsReportModal } from '@/components/commons/CommonsReportModal';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { GonePage } from '@/pages/GonePage';
import { fetchCommonsPostById, fetchCommonsPosts } from '@/services/commonsService';
import { resolveCommonsAttachmentUrl } from '@/services/commonsUploadService';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthGate } from '@/contexts/AuthGateContext';
import {
  sanitizeStudentDisplayName,
  maskPublicUserText,
  extractIdFromSlug,
  buildEntitySlug,
} from '@/utils/privacy';
import type { CommonsPost } from '@/types/commons';
import { COMMONS_POST_TYPES } from '@/types/commons';

export const MaterialDetailPage: React.FC = () => {
  const { idSlug } = useParams<{ idSlug: string }>();
  const materialId = extractIdFromSlug(idSlug);
  const { user } = useAuth();
  const { requireAuth } = useAuthGate();

  const [material, setMaterial] = useState<CommonsPost | null>(null);
  const [relatedMaterials, setRelatedMaterials] = useState<CommonsPost[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'not_found' | 'gone'>('loading');
  const [copied, setCopied] = useState(false);
  const [viewerImage, setViewerImage] = useState<{ url: string; name?: string } | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!materialId) {
      setStatus('not_found');
      return;
    }
    setStatus('loading');
    fetchCommonsPostById(materialId)
      .then(async (doc) => {
        if (!mounted) return;
        if (!doc) {
          setStatus('not_found');
          return;
        }
        if ((doc as any).isHidden || (doc as any).status === 'removed') {
          setStatus('gone');
          return;
        }
        setMaterial(doc);
        setStatus('ready');

        try {
          const feed = await fetchCommonsPosts({ feedTab: 'all', pageSize: 8 });
          if (mounted) {
            setRelatedMaterials(
              feed.posts.filter((p) => p.id !== doc.id).slice(0, 4)
            );
          }
        } catch {
          // ignore
        }
      })
      .catch(() => {
        if (mounted) setStatus('not_found');
      });
    return () => {
      mounted = false;
    };
  }, [materialId]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pt-28 pb-24 px-4">
        <div className="max-w-3xl mx-auto glass-panel p-8 animate-pulse h-64" />
      </div>
    );
  }

  if (status === 'gone') {
    return <GonePage />;
  }

  if (status === 'not_found' || !material) {
    return <NotFoundPage />;
  }

  const canonicalSlug = buildEntitySlug(material.id, material.title);
  const canonicalPath = `/material/${canonicalSlug}`;
  const typeMeta = COMMONS_POST_TYPES[material.type] || COMMONS_POST_TYPES.notes;
  const uploaderName = material.isAnonymous
    ? material.anonymousAlias || 'Anonymous Student'
    : sanitizeStudentDisplayName(material.authorName, material.authorUid);

  const files = material.files || [];
  const imageFiles = files.filter(
    (f) => f.type?.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(f.name || '')
  );
  const docFiles = files.filter(
    (f) => !f.type?.startsWith('image/') && !/\.(png|jpe?g|webp|gif|svg)$/i.test(f.name || '')
  );

  const subjectSlug = (material.subject || 'physics').toLowerCase().replace(/\s+/g, '-');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: material.title,
    description: maskPublicUserText(material.description),
    learningResourceType: typeMeta.badgeLabel,
    educationalLevel: material.target || 'Class 11 & 12 / University Entrance',
    author: {
      '@type': 'Person',
      name: uploaderName,
    },
    url: `https://boardly.cfd${canonicalPath}`,
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pt-28 pb-24 px-4 sm:px-6">
      <PageMeta
        title={`${material.title} — ${material.subject || 'Study Material'} PDF & Notes`}
        description={
          maskPublicUserText(material.description).slice(0, 155) ||
          `Preview and download ${material.title} (${typeMeta.badgeLabel}) for ${material.subject || 'exam'} preparation on Boardly.`
        }
        canonicalPath={canonicalPath}
        ogType="article"
        jsonLd={jsonLd}
      />

      <div className="max-w-3xl mx-auto">
        <Breadcrumbs
          items={[
            { label: 'Study Material', href: '/material' },
            ...(material.subject
              ? [{ label: material.subject, href: `/material/subject/${subjectSlug}` }]
              : []),
            { label: material.title },
          ]}
        />

        <article className="glass-panel p-7 sm:p-9 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="section-chip-red">
              <FileText size={13} />
              <span>{typeMeta.badgeLabel}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(`https://boardly.cfd${canonicalPath}`);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="glass-pill px-3 py-1.5 text-xs text-white/75 hover:text-white inline-flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Share2 size={13} />}
                <span>{copied ? 'Link Copied' : 'Share'}</span>
              </button>

              <button
                type="button"
                onClick={() => requireAuth('report this study material', () => setReportOpen(true))}
                className="glass-pill px-3 py-1.5 text-xs text-white/60 hover:text-[#D71921] inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Flag size={13} />
                <span>Report</span>
              </button>
            </div>
          </div>

          <h1 className="font-dot text-2xl sm:text-3xl font-bold text-white mb-3">
            {material.title}
          </h1>

          {/* Public Metadata Table */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="glass-card p-3.5">
              <span className="text-[10px] uppercase tracking-wider text-white/45 block">
                Subject
              </span>
              <span className="text-xs sm:text-sm font-bold text-white">
                {material.subject || 'General'}
              </span>
            </div>
            <div className="glass-card p-3.5">
              <span className="text-[10px] uppercase tracking-wider text-white/45 block">
                Resource Type
              </span>
              <span className="text-xs sm:text-sm font-bold text-white">
                {typeMeta.badgeLabel}
              </span>
            </div>
            <div className="glass-card p-3.5">
              <span className="text-[10px] uppercase tracking-wider text-white/45 block">
                Uploader
              </span>
              <span className="text-xs sm:text-sm font-bold text-white truncate block">
                {uploaderName}
              </span>
            </div>
            <div className="glass-card p-3.5">
              <span className="text-[10px] uppercase tracking-wider text-white/45 block">
                Attachments
              </span>
              <span className="text-xs sm:text-sm font-bold text-white">
                {files.length > 0 ? `${files.length} File(s)` : 'Text Note'}
              </span>
            </div>
          </div>

          {/* Public Description / Preview */}
          {material.description && (
            <div className="glass-card p-5 mb-6">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">
                <Eye size={14} className="text-[#D71921]" />
                <span>Public Overview &amp; Notes Preview</span>
              </div>
              <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
                {maskPublicUserText(material.description)}
              </p>
            </div>
          )}

          {/* Public Image Previews */}
          {imageFiles.length > 0 && (
            <div className="space-y-3 mb-6">
              {imageFiles.map((file, idx) => (
                <CommonsImageAttachment
                  key={idx}
                  file={file}
                  authorUid={material.isAnonymous ? null : material.authorUid}
                  onOpenViewer={(url, name) =>
                    setViewerImage({ url, name: name || material.title })
                  }
                />
              ))}
            </div>
          )}

          {/* Downloadable Files Section (Requires Login) */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white/50">
              Download Files
            </h2>
            {docFiles.length > 0 ? (
              docFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="glass-row flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#D71921]/15 border border-[#D71921]/30 flex items-center justify-center text-[#D71921] shrink-0">
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{file.name}</p>
                      <p className="text-xs text-white/50">
                        {file.type || 'Document'} ·{' '}
                        {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Verified Resource'}
                      </p>
                    </div>
                  </div>

                  {user ? (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const resolvedUrl = await resolveCommonsAttachmentUrl(file.url);
                          const a = document.createElement('a');
                          a.href = resolvedUrl;
                          a.download = file.name || 'study-material.pdf';
                          a.target = '_blank';
                          a.rel = 'ugc nofollow noopener noreferrer';
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                        } catch (err) {
                          console.warn('[MaterialDetailPage] Attachment download error:', err);
                        }
                      }}
                      className="btn-primary px-5 py-2.5 text-xs font-semibold inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                    >
                      <Download size={15} />
                      <span>Download File</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => requireAuth('download this study material file')}
                      className="btn-primary px-5 py-2.5 text-xs font-semibold inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                    >
                      <Lock size={14} />
                      <span>Sign in to Download</span>
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="glass-card p-4 flex items-center justify-between gap-4">
                <span className="text-xs text-white/65">
                  View full community discussion and comments on this study note:
                </span>
                <Link
                  to={`/commons/post/${canonicalSlug}`}
                  className="btn-secondary px-4 py-2 text-xs font-semibold shrink-0"
                >
                  Open in Commons →
                </Link>
              </div>
            )}
          </div>
        </article>

        {/* Related Practice Link */}
        <div className="glass-panel p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <BookOpen size={20} className="text-[#D71921] shrink-0" />
            <div>
              <h2 className="font-dot text-lg font-bold text-white">
                Practice {material.subject || 'Subject'} MCQs
              </h2>
              <p className="text-xs text-white/65">
                Test your understanding with chapter-by-chapter MCQs and step-by-step KaTeX derivations.
              </p>
            </div>
          </div>
          <Link
            to={`/mcqs/${subjectSlug}`}
            className="btn-primary px-5 py-2.5 text-xs font-semibold shrink-0"
          >
            Practice {material.subject || 'MCQs'} →
          </Link>
        </div>

        {/* Related Study Materials */}
        {relatedMaterials.length > 0 && (
          <section className="glass-panel p-6 sm:p-8">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="font-dot text-xl font-bold text-white">
                More Study Materials in Library
              </h2>
              <Link
                to="/material"
                className="text-xs text-[#D71921] hover:underline font-semibold"
              >
                Browse All →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedMaterials.map((rm) => (
                <Link
                  key={rm.id}
                  to={`/material/${buildEntitySlug(rm.id, rm.title)}`}
                  className="glass-card-interactive p-4 block"
                >
                  <span className="text-[11px] text-[#D71921] font-semibold uppercase">
                    {rm.subject || 'Study Material'}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-1 line-clamp-2">{rm.title}</h3>
                  <p className="text-xs text-white/60 mt-1 line-clamp-2">
                    {maskPublicUserText(rm.description)}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <CommonsImageViewerModal
        isOpen={Boolean(viewerImage)}
        imageUrl={viewerImage?.url || null}
        imageAlt={viewerImage?.name || material.title}
        onClose={() => setViewerImage(null)}
      />

      <CommonsReportModal
        post={material}
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        reporterUid={user?.uid || null}
      />
    </div>
  );
};

export default MaterialDetailPage;

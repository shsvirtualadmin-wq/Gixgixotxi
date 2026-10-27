import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, RefreshCw } from 'lucide-react';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { resolveCommonsAttachmentUrl } from '@/services/commonsUploadService';
import type { CommonsFileAttachment } from '@/types/commons';

interface CommonsImageAttachmentProps {
  file: CommonsFileAttachment;
  authorUid?: string | null;
  onOpenViewer: (imageUrl: string, imageName?: string) => void;
}

export const CommonsImageAttachment: React.FC<CommonsImageAttachmentProps> = ({
  file,
  authorUid,
  onOpenViewer,
}) => {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setHasError(false);

    async function resolveSource() {
      const rawUrl = file?.url?.trim() || '';
      const rawName = file?.name?.trim() || '';

      // Case 1: Relative server URL (/api/commons/files/...), data: URL, or HTTP(S) URL
      if (
        (rawUrl.startsWith('/api/commons/files/') ||
          rawUrl.startsWith('https://') ||
          rawUrl.startsWith('http://') ||
          rawUrl.startsWith('data:image/')) &&
        !rawUrl.includes('blob:')
      ) {
        if (!isCancelled) {
          setResolvedUrl(rawUrl);
        }
        return;
      }

      // Case 2: Firestore chunked attachment URL (firestore://commons_attachments/...)
      if (rawUrl.startsWith('firestore://')) {
        try {
          const hydrated = await resolveCommonsAttachmentUrl(rawUrl);
          if (!isCancelled && hydrated) {
            setResolvedUrl(hydrated);
            return;
          }
        } catch (err) {
          console.warn('[CommonsImageAttachment] Failed to resolve firestore:// attachment:', err);
        }
      }

      // Case 3: Resolve from Firebase Storage path or filename
      const candidatePaths: string[] = [];

      if (rawUrl && (rawUrl.startsWith('users/') || rawUrl.startsWith('posts/') || rawUrl.startsWith('commons/'))) {
        candidatePaths.push(rawUrl);
      }

      const fileNameTarget = rawName || rawUrl.split('/').pop() || '';
      if (authorUid && fileNameTarget && !fileNameTarget.startsWith('blob:')) {
        candidatePaths.push(`users/${authorUid}/posts/${fileNameTarget}`);
        candidatePaths.push(`posts/${authorUid}/${fileNameTarget}`);
        candidatePaths.push(`commons/${authorUid}/${fileNameTarget}`);
      }

      for (const path of candidatePaths) {
        try {
          const storageRef = ref(storage, path);
          const dlUrl = await getDownloadURL(storageRef);
          if (!isCancelled && dlUrl) {
            setResolvedUrl(dlUrl);
            return;
          }
        } catch {
          // try next candidate path
        }
      }

      // If rawUrl was a blob and still loadable in this session, attempt it
      if (rawUrl.startsWith('blob:')) {
        if (!isCancelled) {
          setResolvedUrl(rawUrl);
        }
        return;
      }

      // Could not resolve to a download URL and file is not in storage
      if (!isCancelled) {
        setHasError(true);
        setIsLoading(false);
      }
    }

    resolveSource();

    return () => {
      isCancelled = true;
    };
  }, [file, authorUid, retryKey]);

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    setHasError(false);
    setRetryKey((k) => k + 1);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Error State: Clean placeholder card with photo icon, "Image couldn't load" and "Retry" button
  if (hasError || (!resolvedUrl && !isLoading)) {
    return (
      <div className="rounded-xl border border-border bg-surface-muted/60 p-5 sm:p-6 text-center flex flex-col items-center justify-center space-y-2.5 my-1.5 transition-all">
        <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-muted shadow-2xs">
          <ImageIcon size={20} className="opacity-80" />
        </div>
        <div>
          <p className="text-xs sm:text-sm font-semibold text-secondary">
            Image couldn't load
          </p>
          <p className="text-[11px] text-muted mt-0.5 max-w-xs">
            The image is unavailable or expired.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface hover:bg-surface-raised border border-border text-primary hover:text-accent transition-colors shadow-2xs cursor-pointer active:scale-95"
        >
          <RefreshCw size={12} />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={() => resolvedUrl && onOpenViewer(resolvedUrl, file.name)}
      className="relative rounded-xl overflow-hidden border border-border bg-surface-muted/80 my-2 cursor-pointer group transition-all duration-150 hover:border-border-strong hover:shadow-xs min-h-[180px] max-h-[500px] flex items-center justify-center"
      style={{ aspectRatio: '16 / 10' }}
    >
      {/* Skeleton loading placeholder */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-surface-muted animate-pulse">
          <ImageIcon size={28} className="text-muted/40 mb-2" />
          <div className="h-2 w-24 bg-skeleton rounded-full" />
        </div>
      )}

      {/* Actual Image with lazy loading and CLS protection */}
      {resolvedUrl && (
        <img
          key={`${resolvedUrl}_${retryKey}`}
          src={resolvedUrl}
          alt={file.name || 'Post image'}
          loading="lazy"
          decoding="async"
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={`w-full h-full max-h-[500px] object-cover transition-opacity duration-200 group-hover:opacity-95 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
        />
      )}

      {/* Subtle overlay hint on hover */}
      {!isLoading && !hasError && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
      )}
    </div>
  );
};

export default CommonsImageAttachment;

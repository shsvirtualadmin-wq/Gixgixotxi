import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, RefreshCw } from 'lucide-react';
import {
  resolveCommonsAttachmentUrl,
  R2_PUBLIC_BUCKET_URL,
} from '@/services/commonsUploadService';
import type { CommonsFileAttachment } from '@/types/commons';

interface CommonsImageAttachmentProps {
  file: CommonsFileAttachment;
  authorUid?: string | null;
  onOpenViewer: (imageUrl: string, imageName?: string) => void;
}

export const CommonsImageAttachment: React.FC<CommonsImageAttachmentProps> = ({
  file,
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
      if (!rawUrl) {
        if (!isCancelled) {
          setHasError(true);
          setIsLoading(false);
        }
        return;
      }

      if (
        rawUrl.startsWith('/api/r2/') ||
        rawUrl.startsWith('/api/commons/files/') ||
        rawUrl.startsWith('https://') ||
        rawUrl.startsWith('http://') ||
        rawUrl.startsWith('data:image/') ||
        rawUrl.startsWith('blob:')
      ) {
        if (!isCancelled) {
          setResolvedUrl(rawUrl);
        }
        return;
      }

      if (rawUrl.startsWith('commons/')) {
        if (!isCancelled) {
          setResolvedUrl(`${R2_PUBLIC_BUCKET_URL}/${rawUrl}`);
        }
        return;
      }

      const hydrated = await resolveCommonsAttachmentUrl(rawUrl).catch(() => '');
      if (!isCancelled) {
        if (hydrated) {
          setResolvedUrl(hydrated);
        } else {
          setHasError(true);
          setIsLoading(false);
        }
      }
    }

    void resolveSource();

    return () => {
      isCancelled = true;
    };
  }, [file, retryKey]);

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

  if (hasError || (!resolvedUrl && !isLoading)) {
    return (
      <div className="rounded-xl border border-border bg-surface-muted/60 p-5 sm:p-6 text-center flex flex-col items-center justify-center space-y-2.5 my-1.5 transition-all">
        <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-muted shadow-2xs">
          <ImageIcon size={20} className="opacity-80" />
        </div>
        <div>
          <p className="text-xs sm:text-sm font-semibold text-secondary">
            Image couldn&apos;t load
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
      onClick={(e) => {
        e.stopPropagation();
        if (resolvedUrl && !hasError) {
          onOpenViewer(resolvedUrl, file.name);
        }
      }}
      className="relative rounded-xl overflow-hidden border border-border bg-surface-muted/40 cursor-zoom-in group my-1.5"
    >
      {isLoading && (
        <div className="w-full h-52 sm:h-64 animate-pulse bg-surface-muted flex items-center justify-center text-xs text-muted">
          Loading image...
        </div>
      )}
      {resolvedUrl && (
        <img
          src={resolvedUrl}
          alt={file.name || 'Study attachment'}
          loading="lazy"
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={`w-full max-h-[420px] object-contain bg-black/20 transition-opacity duration-200 ${
            isLoading ? 'opacity-0 h-0' : 'opacity-100'
          }`}
        />
      )}
    </div>
  );
};

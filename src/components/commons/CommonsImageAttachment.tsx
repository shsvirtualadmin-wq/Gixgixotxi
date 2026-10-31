import React, { useState, useEffect } from 'react';
import {
  resolveCommonsAttachmentUrl,
  R2_PUBLIC_BUCKET_URL,
} from '@/services/commonsUploadService';
import type { CommonsFileAttachment } from '@/types/commons';
import { LineLoader } from '@/components/ui/LineLoader';

interface CommonsImageAttachmentProps {
  file: CommonsFileAttachment;
  authorUid?: string | null;
  onOpenViewer: (imageUrl: string, imageName?: string) => void;
}

export const CommonsImageAttachment: React.FC<CommonsImageAttachmentProps> = ({
  file,
  onOpenViewer,
}) => {
  const rawUrl = file?.url?.trim() || '';
  const r2Key = file?.r2Key?.trim() || '';
  const hasSource = Boolean(rawUrl || r2Key);

  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(hasSource);
  const [hasError, setHasError] = useState(!hasSource);

  useEffect(() => {
    if (!hasSource) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    let isCancelled = false;
    setIsLoading(true);
    setHasError(false);

    const timeoutId = window.setTimeout(() => {
      if (!isCancelled) {
        setIsLoading((stillLoading) => {
          if (stillLoading) {
            setHasError(true);
          }
          return false;
        });
      }
    }, 7000);

    async function resolveSource() {
      if (r2Key && r2Key.startsWith('posts/')) {
        if (!isCancelled) {
          setResolvedUrl(`/api/posts/file?key=${encodeURIComponent(r2Key)}`);
        }
        return;
      }

      if (
        rawUrl.startsWith('/api/posts/file') ||
        rawUrl.startsWith('/api/posts/download') ||
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

      if (rawUrl.startsWith('posts/')) {
        if (!isCancelled) {
          setResolvedUrl(`/api/posts/file?key=${encodeURIComponent(rawUrl)}`);
        }
        return;
      }

      if (rawUrl.startsWith('commons/')) {
        if (!isCancelled) {
          setResolvedUrl(`${R2_PUBLIC_BUCKET_URL}/${rawUrl}`);
        }
        return;
      }

      const hydrated = await resolveCommonsAttachmentUrl(rawUrl, r2Key).catch(() => '');
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
      window.clearTimeout(timeoutId);
    };
  }, [rawUrl, r2Key, hasSource]);

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  if (!hasSource || hasError || (!resolvedUrl && !isLoading)) {
    return null;
  }

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (resolvedUrl && !hasError) {
          onOpenViewer(resolvedUrl, file.name);
        }
      }}
      className="relative w-full max-w-full min-w-0 rounded-xl overflow-hidden border border-border bg-surface-muted/40 cursor-zoom-in group my-1.5"
    >
      {isLoading && (
        <div className="w-full py-6 flex items-center justify-center">
          <LineLoader variant="inline" context="generic" immediate />
        </div>
      )}
      {resolvedUrl && (
        <img
          src={resolvedUrl}
          alt={file.name || 'Study attachment'}
          loading="lazy"
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={`w-full max-w-full h-auto max-h-[420px] object-contain bg-black/20 transition-opacity duration-200 ${
            isLoading ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'
          }`}
        />
      )}
    </div>
  );
};


import React from 'react';
import {
  LineLoader,
  inferLoaderContextFromMessages,
  LINE_LOADER_POOLS,
  type LineLoaderContext,
} from './LineLoader';
import { RoutePageSkeleton } from './Skeleton';

export const APP_LOADER_MESSAGES = [...LINE_LOADER_POOLS.generic];

export interface BoardlyLoaderProps {
  loading?: boolean;
  progress?: number;
  messages?: string[];
  message?: string;
  context?: LineLoaderContext;
  variant?: 'page' | 'overlay' | 'inline' | 'section';
  onRetry?: () => void;
  className?: string;
}

export const BoardlyLoader: React.FC<BoardlyLoaderProps> = ({
  loading = true,
  messages,
  message,
  context,
  variant = 'section',
  onRetry,
  className = '',
}) => {
  const resolvedContext =
    context || inferLoaderContextFromMessages(message, messages);

  return (
    <LineLoader
      loading={loading}
      context={resolvedContext}
      message={message}
      messages={messages}
      variant={variant}
      onRetry={onRetry}
      className={className}
    />
  );
};

export interface BoardlySuspenseBoundaryProps {
  children: React.ReactNode;
  variant?: 'page' | 'overlay' | 'inline' | 'section';
  context?: LineLoaderContext;
  message?: string;
  messages?: string[];
}

/**
 * Lightweight Suspense Boundary that renders an inline route-matched gray skeleton
 * while a code chunk downloads — never a full-screen overlay or text loader.
 */
export const BoardlySuspenseBoundary: React.FC<BoardlySuspenseBoundaryProps> = ({
  children,
}) => {
  return (
    <React.Suspense
      fallback={
        <div className="w-full max-w-5xl mx-auto px-3.5 sm:px-6 pt-3">
          <RoutePageSkeleton />
        </div>
      }
    >
      {children}
    </React.Suspense>
  );
};

export default BoardlyLoader;

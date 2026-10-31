import React, { useEffect, useState } from 'react';
import {
  LineLoader,
  inferLoaderContextFromPath,
  inferLoaderContextFromMessages,
  LINE_LOADER_POOLS,
  type LineLoaderContext,
} from './LineLoader';

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
  variant = 'page',
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
      variant={variant === 'inline' ? 'section' : variant}
      onRetry={onRetry}
      className={className}
    />
  );
};

const SuspenseFallbackSignal: React.FC<{
  onSuspendChange: (suspended: boolean) => void;
}> = ({ onSuspendChange }) => {
  useEffect(() => {
    onSuspendChange(true);
    return () => {
      onSuspendChange(false);
    };
  }, [onSuspendChange]);

  return null;
};

export interface BoardlySuspenseBoundaryProps {
  children: React.ReactNode;
  variant?: 'page' | 'overlay' | 'inline' | 'section';
  context?: LineLoaderContext;
  message?: string;
  messages?: string[];
}

export const BoardlySuspenseBoundary: React.FC<BoardlySuspenseBoundaryProps> = ({
  children,
  variant = 'overlay',
  context,
  message,
  messages,
}) => {
  const [isSuspended, setIsSuspended] = useState(false);

  const activeContext =
    context ||
    (message || (messages && messages.length > 0)
      ? inferLoaderContextFromMessages(message, messages)
      : inferLoaderContextFromPath());

  return (
    <>
      <LineLoader
        loading={isSuspended}
        context={activeContext}
        message={message}
        messages={messages}
        variant={variant === 'inline' ? 'section' : variant}
      />
      <React.Suspense
        fallback={<SuspenseFallbackSignal onSuspendChange={setIsSuspended} />}
      >
        {children}
      </React.Suspense>
    </>
  );
};

export default BoardlyLoader;

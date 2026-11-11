import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardErrorBoundary } from '@/components/dashboard/DashboardErrorBoundary';
import { getSmoothMode, applySmoothModeToDocument } from '@/utils/smoothMode';
import App from './App';
import './index.css';

// Initialize Smooth Mode synchronously before first render so low-end devices skip heavy CSS effects
applySmoothModeToDocument(getSmoothMode());

// Register lightweight App Shell Service Worker in production builds after load (never force-reloads)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Ignore service worker registration errors
    });
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes fresh
      gcTime: 1000 * 60 * 30, // 30 minutes in memory
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DashboardErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </DashboardErrorBoundary>
  </StrictMode>
);

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

// Handle dynamic chunk import failures cleanly with safe single-reload guard
if (typeof window !== 'undefined') {
  const buildInfo = typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : (typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 'dev');
  console.log(`[Boardly] Initializing client bundle. Build ID: ${buildInfo}`);
  
  // Safely check and unregister any legacy service workers/caches without throwing in sandboxed iframes
  try {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          for (const registration of registrations) {
            registration.unregister().catch(() => {});
          }
        })
        .catch(() => {});
    }
  } catch {
    // Ignore restricted iframe sandbox security errors
  }

  try {
    if ('caches' in window) {
      window.caches
        .keys()
        .then((names) => {
          for (const name of names) {
            window.caches.delete(name).catch(() => {});
          }
        })
        .catch(() => {});
    }
  } catch {
    // Ignore restricted iframe sandbox security errors
  }

  // Prevent uncaught cross-origin script error noise from breaking user execution
  window.addEventListener('error', (event) => {
    if (event.message === 'Script error.' || !event.filename) {
      event.preventDefault?.();
    }
  });

  window.addEventListener('vite:preloadError', (event) => {
    const hasReloaded = sessionStorage.getItem('boardly-preload-reloaded');
    if (!hasReloaded) {
      sessionStorage.setItem('boardly-preload-reloaded', 'true');
      window.location.reload();
    } else {
      sessionStorage.removeItem('boardly-preload-reloaded');
      console.error('[Vite Preload Error]', event);
    }
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find root element');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);

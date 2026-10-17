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
  
  // Unregister any legacy service workers and purge caches to prevent serving stale cached bundles on boardly.cfd
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().then((unregistered) => {
          if (unregistered) {
            console.log('[Boardly] Purged legacy service worker registration');
          }
        });
      }
    }).catch((swErr) => {
      console.warn('[Boardly] Service worker inspection error:', swErr);
    });
  }

  if ('caches' in window) {
    window.caches.keys().then((names) => {
      for (const name of names) {
        window.caches.delete(name);
      }
    }).catch(() => {});
  }

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

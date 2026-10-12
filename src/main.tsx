import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './lib/boardyMath.ts';
import './index.css';
import { initReferralTracker } from './lib/referralTracker';

// Initialize referral capture from URL query params (?ref=... with 7-day retention)
initReferralTracker();

// Listen for Vite chunk preload failures and trigger reload
window.addEventListener('vite:preloadError', (event: any) => {
  console.warn('[Vite Preload Error] Module preload failed, attempting auto-reload:', event);
  const now = Date.now();
  const lastReload = sessionStorage.getItem('vite_preload_reload');
  if (!lastReload || now - Number(lastReload) > 20000) {
    sessionStorage.setItem('vite_preload_reload', String(now));
    const msg = event?.payload?.message || '';
    if (msg.toLowerCase().includes('studybuddy') || msg.toLowerCase().includes('study_buddy')) {
      sessionStorage.setItem('boardly_reopen_study_buddy', 'true');
    }
    window.location.reload();
  }
});

if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service worker registration failed:', err);
    });
  });
} else if ('serviceWorker' in navigator) {
  // In development, unregister any stale service worker to prevent caching dynamic dev chunks
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister().catch(() => {});
    }
  });
}

if (typeof (window as any).__boardlyClearPreloaderTimer === 'function') {
  (window as any).__boardlyClearPreloaderTimer();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);



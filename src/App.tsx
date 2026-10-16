import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { BackgroundCanvas } from './components/BackgroundCanvas';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { AuthProvider } from './contexts/AuthContext';
import { useReferralCapture } from './hooks/useReferral';
import { Skeleton } from './components/ui/Skeleton';

// Public pages (lazy)
const LandingPage = lazy(() => import('./pages/LandingPage'));
const FeaturesPage = lazy(() => import('./pages/FeaturesPage'));
const ArenaPage = lazy(() => import('./pages/ArenaPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const ReviewsPage = lazy(() => import('./pages/ReviewsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));

// Auth pages (lazy)
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));

// Dashboard (Phase 3)
const DashboardShell = lazy(() =>
  import('./components/dashboard/DashboardShell').then(m => ({ default: m.DashboardShell }))
);
const OverviewPage = lazy(() =>
  import('./pages/dashboard/OverviewPage').then(m => ({ default: m.OverviewPage }))
);
const PracticePage = lazy(() =>
  import('./pages/dashboard/PracticePage').then(m => ({ default: m.PracticePage }))
);
const PlaceholderPage = lazy(() =>
  import('./pages/dashboard/PlaceholderPage').then(m => ({ default: m.PlaceholderPage }))
);

// Test engine (Phase 4)
const TestRunnerPage = lazy(() =>
  import('./pages/test/TestRunnerPage').then(m => ({ default: m.TestRunnerPage }))
);
const TestResultPage = lazy(() =>
  import('./pages/test/TestResultPage').then(m => ({ default: m.TestResultPage }))
);

function PageLoader() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <Skeleton height={32} width="60%" />
        <div style={{ marginTop: 12 }}><Skeleton height={16} count={3} /></div>
      </div>
    </div>
  );
}

// Separate inner component so useReferralCapture can call useSearchParams (needs Router context)
function AppInner() {
  useReferralCapture();

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Test Engine — full-screen distraction-free, no Navbar/Footer */}
        <Route path="/test/:attemptId/result" element={<TestResultPage />} />
        <Route path="/test/:attemptId" element={<TestRunnerPage />} />

        {/* Public routes (with Navbar + Footer) */}
        <Route
          element={
            <div className="relative min-h-screen flex flex-col" style={{ color: 'var(--text)' }}>
              <BackgroundCanvas />
              <Navbar />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/features" element={<FeaturesPage />} />
                  <Route path="/arena" element={<ArenaPage />} />
                  <Route path="/pricing" element={<PricingPage />} />
                  <Route path="/reviews" element={<ReviewsPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  {/* Auth */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  {/* Onboarding */}
                  <Route path="/onboarding" element={<OnboardingPage />} />
                </Routes>
              </Suspense>
              <Footer />
            </div>
          }
          path="/*"
        />

        {/* Dashboard shell — no Navbar/Footer */}
        <Route path="/dashboard" element={<DashboardShell />}>
          <Route index element={<OverviewPage />} />
          <Route path="practice" element={<PracticePage />} />
          <Route path="past-papers" element={<PlaceholderPage title="Past Papers" />} />
          <Route path="arena" element={<PlaceholderPage title="Arena" />} />
          <Route path="ai-tutor" element={<PlaceholderPage title="AI Tutor" />} />
          <Route path="merit-meter" element={<PlaceholderPage title="Merit Meter" />} />
          <Route path="study-circles" element={<PlaceholderPage title="Study Circles" />} />
          <Route path="reviews" element={<PlaceholderPage title="Reviews" />} />
          <Route path="plans" element={<PlaceholderPage title="Plans" />} />
          <Route path="settings" element={<PlaceholderPage title="Settings" />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

export default App;

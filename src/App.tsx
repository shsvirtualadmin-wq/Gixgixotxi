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

// Dashboard stub (lazy)
const DashboardPage = lazy(() => import('./pages/DashboardPage'));

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
    <div className="relative min-h-screen flex flex-col" style={{ color: 'var(--text)' }}>
      <BackgroundCanvas />
      <Navbar />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
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

          {/* Dashboard (stub — Phase 3 will expand) */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/*" element={<DashboardPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Footer />
    </div>
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

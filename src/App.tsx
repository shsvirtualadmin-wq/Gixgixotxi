import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { useReferralCapture } from './hooks/useReferral';
import { Skeleton } from './components/ui/Skeleton';
import { AdminGuard } from './components/admin/AdminGuard';
import { AdminLayout } from './components/admin/AdminLayout';
import { PublicLayout } from './components/layout/PublicLayout';

// Public pages (lazy)
const LandingPage = lazy(() => import('./pages/LandingPage'));
const FeaturesPage = lazy(() => import('./pages/FeaturesPage'));
const ArenaPage = lazy(() => import('./pages/ArenaPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const ReviewsPage = lazy(() => import('./pages/ReviewsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));

// Auth pages (lazy) — use AuthLayout ONLY, NO public Navbar or Footer
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));

// Dashboard (Student Portal) — uses DashboardShell ONLY, NO public Navbar or Footer
const DashboardShell = lazy(() =>
  import('./components/dashboard/DashboardShell').then(m => ({ default: m.DashboardShell }))
);
const OverviewPage = lazy(() =>
  import('./pages/dashboard/OverviewPage').then(m => ({ default: m.OverviewPage }))
);
const PracticePage = lazy(() =>
  import('./pages/dashboard/PracticePage').then(m => ({ default: m.PracticePage }))
);
const PlansBillingPage = lazy(() =>
  import('./pages/dashboard/PlansBillingPage').then(m => ({ default: m.PlansBillingPage }))
);
const ArenaDashboardPage = lazy(() =>
  import('./pages/dashboard/ArenaDashboardPage').then(m => ({ default: m.ArenaDashboardPage }))
);
const WeakChaptersPage = lazy(() =>
  import('./pages/dashboard/WeakChaptersPage').then(m => ({ default: m.WeakChaptersPage }))
);
const StreaksPage = lazy(() =>
  import('./pages/dashboard/StreaksPage').then(m => ({ default: m.StreaksPage }))
);
const SettingsPage = lazy(() =>
  import('./pages/dashboard/SettingsPage').then(m => ({ default: m.SettingsPage }))
);
const ResultsListPage = lazy(() =>
  import('./pages/dashboard/ResultsListPage').then(m => ({ default: m.ResultsListPage }))
);
const PlaceholderPage = lazy(() =>
  import('./pages/dashboard/PlaceholderPage').then(m => ({ default: m.PlaceholderPage }))
);

// Test engine — full-screen distraction-free, NO Navbar or Footer
const TestRunnerPage = lazy(() =>
  import('./pages/test/TestRunnerPage').then(m => ({ default: m.TestRunnerPage }))
);
const TestResultPage = lazy(() =>
  import('./pages/test/TestResultPage').then(m => ({ default: m.TestResultPage }))
);

// AI Tutor, Crew, Captain
const AiTutorPage = lazy(() =>
  import('./pages/dashboard/AiTutorPage').then(m => ({ default: m.AiTutorPage }))
);
const CrewDashboardPage = lazy(() =>
  import('./pages/crew/CrewDashboardPage').then(m => ({ default: m.CrewDashboardPage }))
);
const CrewApplyPage = lazy(() =>
  import('./pages/crew/CrewApplyPage').then(m => ({ default: m.CrewApplyPage }))
);
const CaptainDashboardPage = lazy(() =>
  import('./pages/captain/CaptainDashboardPage').then(m => ({ default: m.CaptainDashboardPage }))
);
const CaptainApplyPage = lazy(() =>
  import('./pages/captain/CaptainApplyPage').then(m => ({ default: m.CaptainApplyPage }))
);
const CaptainLeaderboardPage = lazy(() =>
  import('./pages/captain/CaptainLeaderboardPage').then(m => ({ default: m.CaptainLeaderboardPage }))
);

// Super-Admin Portal — strictly guarded with AdminGuard + AdminLayout
const AdminOverviewPage = lazy(() =>
  import('./pages/admin/AdminOverviewPage').then(m => ({ default: m.AdminOverviewPage }))
);
const AdminUsersPage = lazy(() =>
  import('./pages/admin/AdminUsersPage').then(m => ({ default: m.AdminUsersPage }))
);
const AdminQuestionsPage = lazy(() =>
  import('./pages/admin/AdminQuestionsPage').then(m => ({ default: m.AdminQuestionsPage }))
);
const AdminApplicationsPage = lazy(() =>
  import('./pages/admin/AdminApplicationsPage').then(m => ({ default: m.AdminApplicationsPage }))
);
const AdminPaymentsPage = lazy(() =>
  import('./pages/admin/AdminPaymentsPage').then(m => ({ default: m.AdminPaymentsPage }))
);
const AdminReviewsPage = lazy(() =>
  import('./pages/admin/AdminReviewsPage').then(m => ({ default: m.AdminReviewsPage }))
);
const AdminAuditLogsPage = lazy(() =>
  import('./pages/admin/AdminAuditLogsPage').then(m => ({ default: m.AdminAuditLogsPage }))
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

        {/* Super-Admin Portal — strictly guarded for admin, no public Navbar/Footer */}
        <Route
          path="/admin"
          element={
            <AdminGuard>
              <AdminLayout />
            </AdminGuard>
          }
        >
          <Route index element={<AdminOverviewPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="questions" element={<AdminQuestionsPage />} />
          <Route path="applications" element={<AdminApplicationsPage />} />
          <Route path="payments" element={<AdminPaymentsPage />} />
          <Route path="reviews" element={<AdminReviewsPage />} />
          <Route path="audit-logs" element={<AdminAuditLogsPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>

        {/* Dashboard shell (Student Portal) — no public Navbar/Footer */}
        <Route path="/dashboard" element={<DashboardShell />}>
          <Route index element={<OverviewPage />} />
          <Route path="practice" element={<PracticePage />} />
          <Route path="weak-chapters" element={<WeakChaptersPage />} />
          <Route path="streaks" element={<StreaksPage />} />
          <Route path="history" element={<ResultsListPage />} />
          <Route path="past-papers" element={<PlaceholderPage title="Past Papers" />} />
          <Route path="arena" element={<ArenaDashboardPage />} />
          <Route path="ai-tutor" element={<AiTutorPage />} />
          <Route path="merit-meter" element={<PlaceholderPage title="Merit Meter" />} />
          <Route path="study-circles" element={<PlaceholderPage title="Study Circles" />} />
          <Route path="reviews" element={<PlaceholderPage title="Reviews" />} />
          <Route path="plans" element={<PlansBillingPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>

        {/* Global shortcuts for plans and settings */}
        <Route path="/plans" element={<Navigate to="/dashboard/plans" replace />} />
        <Route path="/settings" element={<Navigate to="/dashboard/settings" replace />} />

        {/* Public Marketing routes ONLY (wrapped by PublicLayout with Navbar + Footer) */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/arena" element={<ArenaPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Route>

        {/* Auth routes ONLY (use AuthLayout ONLY, NO public Navbar or Footer) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        {/* Onboarding — uses OnboardingShell */}
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* Crew & Captain Portals — independent shells, NO public Navbar or Footer */}
        <Route path="/crew" element={<CrewDashboardPage />} />
        <Route path="/crew/apply" element={<CrewApplyPage />} />
        <Route path="/captain" element={<CaptainDashboardPage />} />
        <Route path="/captain/apply" element={<CaptainApplyPage />} />
        <Route path="/captain/leaderboard" element={<CaptainLeaderboardPage />} />

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

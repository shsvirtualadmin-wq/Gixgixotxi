import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { useReferralCapture } from './hooks/useReferral';
import { Skeleton } from './components/ui/Skeleton';
import { AdminGuard } from './components/admin/AdminGuard';
import { AdminLayout } from './components/admin/AdminLayout';
import { PublicLayout } from './components/layout/PublicLayout';
import { DashboardShell } from './components/dashboard/DashboardShell';
import { DashboardErrorBoundary } from './components/dashboard/DashboardErrorBoundary';
import { DebugPanel } from './components/debug/DebugPanel';

/**
 * Robust chunk import with 2 retries and single guarded reload
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries = 2
): React.LazyExoticComponent<T> {
  return lazy(() => {
    return new Promise<{ default: T }>((resolve, reject) => {
      const attempt = (remaining: number) => {
        factory()
          .then(resolve)
          .catch((error) => {
            if (remaining > 0) {
              setTimeout(() => attempt(remaining - 1), 600);
            } else {
              const reloadKey = 'boardly_chunk_retry_reloaded';
              const hasReloaded = sessionStorage.getItem(reloadKey);
              if (!hasReloaded) {
                sessionStorage.setItem(reloadKey, 'true');
                window.location.reload();
              } else {
                sessionStorage.removeItem(reloadKey);
                reject(error);
              }
            }
          });
      };
      attempt(retries);
    });
  });
}

// Public pages (lazy with retry)
const LandingPage = lazyWithRetry(() => import('./pages/LandingPage'));
const FeaturesPage = lazyWithRetry(() => import('./pages/FeaturesPage'));
const ArenaPage = lazyWithRetry(() => import('./pages/ArenaPage'));
const PricingPage = lazyWithRetry(() => import('./pages/PricingPage'));
const ReviewsPage = lazyWithRetry(() => import('./pages/ReviewsPage'));
const PrivacyPage = lazyWithRetry(() => import('./pages/PrivacyPage'));
const TermsPage = lazyWithRetry(() => import('./pages/TermsPage'));
const ContactPage = lazyWithRetry(() => import('./pages/ContactPage'));

// Auth pages (lazy with retry) — use AuthLayout ONLY, NO public Navbar or Footer
const LoginPage = lazyWithRetry(() => import('./pages/LoginPage'));
const SignupPage = lazyWithRetry(() => import('./pages/SignupPage'));
const ForgotPasswordPage = lazyWithRetry(() => import('./pages/ForgotPasswordPage'));
const VerifyEmailPage = lazyWithRetry(() => import('./pages/VerifyEmailPage'));
const OnboardingPage = lazyWithRetry(() => import('./pages/OnboardingPage'));

// Dashboard (Student Portal) — DashboardShell is NON-LAZY to prevent unmounting between tabs
const OverviewPage = lazyWithRetry(() =>
  import('./pages/dashboard/OverviewPage').then(m => ({ default: m.OverviewPage }))
);
const PracticePage = lazyWithRetry(() =>
  import('./pages/dashboard/PracticePage').then(m => ({ default: m.PracticePage }))
);
const PlansBillingPage = lazyWithRetry(() =>
  import('./pages/dashboard/PlansBillingPage').then(m => ({ default: m.PlansBillingPage }))
);
const ArenaDashboardPage = lazyWithRetry(() =>
  import('./pages/dashboard/ArenaDashboardPage').then(m => ({ default: m.ArenaDashboardPage }))
);
const WeakChaptersPage = lazyWithRetry(() =>
  import('./pages/dashboard/WeakChaptersPage').then(m => ({ default: m.WeakChaptersPage }))
);
const StreaksPage = lazyWithRetry(() =>
  import('./pages/dashboard/StreaksPage').then(m => ({ default: m.StreaksPage }))
);
const SettingsPage = lazyWithRetry(() =>
  import('./pages/dashboard/SettingsPage').then(m => ({ default: m.SettingsPage }))
);
const ProfilePage = lazyWithRetry(() =>
  import('./pages/dashboard/ProfilePage').then(m => ({ default: m.ProfilePage }))
);
const ResultsListPage = lazyWithRetry(() =>
  import('./pages/dashboard/ResultsListPage').then(m => ({ default: m.ResultsListPage }))
);
const PlaceholderPage = lazyWithRetry(() =>
  import('./pages/dashboard/PlaceholderPage').then(m => ({ default: m.PlaceholderPage }))
);

// Test engine — full-screen distraction-free, NO Navbar or Footer
const TestRunnerPage = lazyWithRetry(() =>
  import('./pages/test/TestRunnerPage').then(m => ({ default: m.TestRunnerPage }))
);
const TestResultPage = lazyWithRetry(() =>
  import('./pages/test/TestResultPage').then(m => ({ default: m.TestResultPage }))
);

// AI Tutor, Crew, Captain
const AiTutorPage = lazyWithRetry(() =>
  import('./pages/dashboard/AiTutorPage').then(m => ({ default: m.AiTutorPage }))
);
const CrewDashboardPage = lazyWithRetry(() =>
  import('./pages/crew/CrewDashboardPage').then(m => ({ default: m.CrewDashboardPage }))
);
const JoinCrewPage = lazyWithRetry(() =>
  import('./pages/crew/JoinCrewPage').then(m => ({ default: m.JoinCrewPage }))
);
const CrewApplyPage = lazyWithRetry(() =>
  import('./pages/crew/CrewApplyPage').then(m => ({ default: m.CrewApplyPage }))
);
const CaptainDashboardPage = lazyWithRetry(() =>
  import('./pages/captain/CaptainDashboardPage').then(m => ({ default: m.CaptainDashboardPage }))
);
const CaptainApplyPage = lazyWithRetry(() =>
  import('./pages/captain/CaptainApplyPage').then(m => ({ default: m.CaptainApplyPage }))
);
const CaptainLeaderboardPage = lazyWithRetry(() =>
  import('./pages/captain/CaptainLeaderboardPage').then(m => ({ default: m.CaptainLeaderboardPage }))
);

// Super-Admin Portal — strictly guarded with AdminGuard + AdminLayout
const AdminOverviewPage = lazyWithRetry(() =>
  import('./pages/admin/AdminOverviewPage').then(m => ({ default: m.AdminOverviewPage }))
);
const AdminUsersPage = lazyWithRetry(() =>
  import('./pages/admin/AdminUsersPage').then(m => ({ default: m.AdminUsersPage }))
);
const AdminQuestionsPage = lazyWithRetry(() =>
  import('./pages/admin/AdminQuestionsPage').then(m => ({ default: m.AdminQuestionsPage }))
);
const AdminApplicationsPage = lazyWithRetry(() =>
  import('./pages/admin/AdminApplicationsPage').then(m => ({ default: m.AdminApplicationsPage }))
);
const AdminPaymentsPage = lazyWithRetry(() =>
  import('./pages/admin/AdminPaymentsPage').then(m => ({ default: m.AdminPaymentsPage }))
);
const AdminReviewsPage = lazyWithRetry(() =>
  import('./pages/admin/AdminReviewsPage').then(m => ({ default: m.AdminReviewsPage }))
);
const AdminAuditLogsPage = lazyWithRetry(() =>
  import('./pages/admin/AdminAuditLogsPage').then(m => ({ default: m.AdminAuditLogsPage }))
);
const AdminHealthPage = lazyWithRetry(() =>
  import('./pages/admin/AdminHealthPage').then(m => ({ default: m.AdminHealthPage }))
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
    <DashboardErrorBoundary fallbackTitle="Boardly encountered an issue">
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
          <Route path="health" element={<AdminHealthPage />} />
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
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>

        {/* Global shortcuts for plans, profile and settings */}
        <Route path="/plans" element={<Navigate to="/dashboard/plans" replace />} />
        <Route path="/profile" element={<Navigate to="/dashboard/profile" replace />} />
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
        <Route path="/crews" element={<Navigate to="/crew" replace />} />
        <Route path="/crew/apply" element={<CrewApplyPage />} />
        <Route path="/join/:code" element={<JoinCrewPage />} />
        <Route path="/join" element={<Navigate to="/crew" replace />} />
        <Route path="/dashboard/crew" element={<Navigate to="/crew" replace />} />
        <Route path="/captain" element={<CaptainDashboardPage />} />
        <Route path="/captain/apply" element={<CaptainApplyPage />} />
        <Route path="/captain/leaderboard" element={<CaptainLeaderboardPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
    {import.meta.env.DEV && <DebugPanel />}
    </DashboardErrorBoundary>
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

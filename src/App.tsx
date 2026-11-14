import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ProfileModalProvider, ProfileModalHost } from './contexts/ProfileModalContext';
import { useReferralCapture } from './hooks/useReferral';
import { PublicLayout } from './components/layout/PublicLayout';
import { DashboardErrorBoundary } from './components/dashboard/DashboardErrorBoundary';

const LazyDebugPanel = lazy(() =>
  import('./components/debug/DebugPanel')
    .then((m) => ({ default: m.DebugPanel }))
    .catch(() => ({ default: () => null }))
);

/**
 * Robust chunk import with 2 retries and single guarded reload
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<any>,
  retries = 2
): React.LazyExoticComponent<T> {
  return lazy(() => {
    return new Promise<{ default: T }>((resolve, reject) => {
      const attempt = (remaining: number) => {
        factory()
          .then((mod) => {
            try {
              sessionStorage.removeItem('boardly_chunk_retry_reloaded');
            } catch {
              // ignore
            }
            if (mod && mod.default) {
              resolve(mod as { default: T });
              return;
            }
            if (mod && typeof mod === 'object') {
              const keys = Object.keys(mod).filter((k) => k !== 'default' && k !== '__esModule');
              const componentKey =
                keys.find((k) => typeof mod[k] === 'function' && k.endsWith('Page')) ||
                keys.find((k) => typeof mod[k] === 'function' && /^[A-Z]/.test(k)) ||
                keys.find((k) => typeof mod[k] === 'function');
              if (componentKey) {
                resolve({ default: mod[componentKey] as T });
                return;
              }
            }
            resolve(mod as { default: T });
          })
          .catch((error) => {
            if (remaining > 0) {
              setTimeout(() => attempt(remaining - 1), 500);
            } else {
              try {
                const reloadKey = 'boardly_chunk_retry_reloaded';
                const lastReload = Number(sessionStorage.getItem(reloadKey) || '0');
                const now = Date.now();
                if (!lastReload || now - lastReload > 15000) {
                  sessionStorage.setItem(reloadKey, String(now));
                  window.location.reload();
                  return;
                }
              } catch {
                // ignore storage errors
              }
              reject(error);
            }
          });
      };
      attempt(retries);
    });
  });
}

import { ScrollToTop } from './components/ui/ScrollToTop';
import { WallpaperBackground } from './components/WallpaperBackground';

const AdminGuard = lazyWithRetry(() =>
  import('./components/admin/AdminGuard').then((m) => ({ default: m.AdminGuard }))
);
const AdminLayout = lazyWithRetry(() =>
  import('./components/admin/AdminLayout').then((m) => ({ default: m.AdminLayout }))
);
import { DashboardShell } from './components/dashboard/DashboardShell';

// Public Marketing, Knowledge & Community routes
const LandingPage = lazyWithRetry(() => import('./pages/LandingPage'));
const AboutPage = lazyWithRetry(() => import('./pages/AboutPage'));
const FeaturesPage = lazyWithRetry(() => import('./pages/FeaturesPage'));
const HowItWorksPage = lazyWithRetry(() => import('./pages/HowItWorksPage'));
const FaqPage = lazyWithRetry(() => import('./pages/FaqPage'));
const CrewPage = lazyWithRetry(() => import('./pages/crew/CrewPage'));
const CrewPublicDetailPage = lazyWithRetry(() => import('./pages/crew/CrewPublicDetailPage'));
const ArenaPage = lazyWithRetry(() => import('./pages/ArenaPage'));
const PricingPage = lazyWithRetry(() => import('./pages/PricingPage'));
const NakamaCaptainsPage = lazyWithRetry(() => import('./pages/NakamaCaptainsPage'));
const CaptainPublicProfilePage = lazyWithRetry(() => import('./pages/captain/CaptainPublicProfilePage'));
const GrandLinePage = lazyWithRetry(() => import('./pages/GrandLinePage'));
const GrandLineAboutPage = lazyWithRetry(() => import('./pages/GrandLineAboutPage'));
const GrandLineLeaderboardPage = lazyWithRetry(() => import('./pages/GrandLineLeaderboardPage'));
const GrandLineTestInfoPage = lazyWithRetry(() => import('./pages/GrandLineTestInfoPage'));
const GrandLineTestRunnerPage = lazyWithRetry(() => import('./pages/GrandLineTestRunnerPage'));
const PrivacyPage = lazyWithRetry(() => import('./pages/PrivacyPage'));
const TermsPage = lazyWithRetry(() => import('./pages/TermsPage'));
const ContactPage = lazyWithRetry(() => import('./pages/ContactPage'));
const StorePage = lazyWithRetry(() => import('./pages/store/StorePage'));
const StoreItemDetailPage = lazyWithRetry(() => import('./pages/store/StoreItemDetailPage'));
const KobansPage = lazyWithRetry(() => import('./pages/KobansPage'));
const RewardsPage = lazyWithRetry(() => import('./pages/RewardsPage'));
const McqsHubPage = lazyWithRetry(() => import('./pages/mcqs/McqsHubPage'));
const McqSubjectPage = lazyWithRetry(() => import('./pages/mcqs/McqSubjectPage'));
const McqChapterPage = lazyWithRetry(() => import('./pages/mcqs/McqChapterPage'));
const MaterialLibraryPage = lazyWithRetry(() => import('./pages/material/MaterialLibraryPage'));
const MaterialDetailPage = lazyWithRetry(() => import('./pages/material/MaterialDetailPage'));
const MaterialSubjectPage = lazyWithRetry(() => import('./pages/material/MaterialSubjectPage'));
const PublicPostDetailPage = lazyWithRetry(() => import('./pages/commons/PublicPostDetailPage'));
const CommonsSubjectPage = lazyWithRetry(() => import('./pages/commons/CommonsSubjectPage'));
const PublicUserProfilePage = lazyWithRetry(() => import('./pages/profile/PublicUserProfilePage'));
const SearchPage = lazyWithRetry(() => import('./pages/SearchPage'));
const NotFoundPage = lazyWithRetry(() => import('./pages/NotFoundPage'));
const GonePage = lazyWithRetry(() => import('./pages/GonePage'));

// Auth pages (lazy with retry) — use AuthLayout ONLY, NO public Navbar or Footer
const LoginPage = lazyWithRetry(() => import('./pages/LoginPage'));
const SignupPage = lazyWithRetry(() => import('./pages/SignupPage'));
const ForgotPasswordPage = lazyWithRetry(() => import('./pages/ForgotPasswordPage'));
const VerifyEmailPage = lazyWithRetry(() => import('./pages/VerifyEmailPage'));
const OnboardingPage = lazyWithRetry(() => import('./pages/OnboardingPage'));

// Dashboard (Student Portal) — route-level code-split so public & non-overview routes don't pull OverviewPage / Three.js
const OverviewPage = lazyWithRetry(() =>
  import('./pages/dashboard/OverviewPage').then((m) => ({ default: m.OverviewPage }))
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
const NotificationsPage = lazyWithRetry(() =>
  import('./pages/dashboard/NotificationsPage').then(m => ({ default: m.NotificationsPage }))
);
const MessagesPage = lazyWithRetry(() =>
  import('./pages/dashboard/MessagesPage').then(m => ({ default: m.MessagesPage }))
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
const MyCertificatesPage = lazyWithRetry(() =>
  import('./pages/dashboard/MyCertificatesPage').then(m => ({ default: m.MyCertificatesPage }))
);
const VerifyCertificatePage = lazyWithRetry(() =>
  import('./pages/VerifyCertificatePage').then(m => ({ default: m.VerifyCertificatePage }))
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
const AmbassadorDashboardPage = lazyWithRetry(() =>
  import('./pages/dashboard/AmbassadorDashboardPage').then(m => ({ default: m.AmbassadorDashboardPage }))
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
const AdminCaptainsPage = lazyWithRetry(() =>
  import('./pages/admin/AdminCaptainsPage').then(m => ({ default: m.AdminCaptainsPage }))
);
const AdminAuditLogsPage = lazyWithRetry(() =>
  import('./pages/admin/AdminAuditLogsPage').then(m => ({ default: m.AdminAuditLogsPage }))
);
const AdminHealthPage = lazyWithRetry(() =>
  import('./pages/admin/AdminHealthPage').then(m => ({ default: m.AdminHealthPage }))
);
const AdminCrewsPage = lazyWithRetry(() =>
  import('./pages/admin/AdminCrewsPage').then(m => ({ default: m.AdminCrewsPage }))
);
const AdminKobansPage = lazyWithRetry(() =>
  import('./pages/admin/AdminKobansPage').then(m => ({ default: m.AdminKobansPage }))
);
const AdminAnnouncementsPage = lazyWithRetry(() =>
  import('./pages/admin/AdminAnnouncementsPage').then(m => ({ default: m.AdminAnnouncementsPage }))
);
const AdminCommonsPage = lazyWithRetry(() =>
  import('./pages/admin/AdminCommonsPage').then(m => ({ default: m.AdminCommonsPage }))
);
const AdminBotsPage = lazyWithRetry(() =>
  import('./pages/admin/AdminBotsPage').then(m => ({ default: m.AdminBotsPage }))
);
const AdminPricingPage = lazyWithRetry(() =>
  import('./pages/admin/AdminPricingPage').then(m => ({ default: m.AdminPricingPage }))
);
const AdminCertificatesPage = lazyWithRetry(() =>
  import('./pages/admin/AdminCertificatesPage').then(m => ({ default: m.AdminCertificatesPage }))
);
const AdminAccessRequestsPage = lazyWithRetry(() =>
  import('./pages/admin/AdminAccessRequestsPage').then(m => ({ default: m.AdminAccessRequestsPage }))
);

// Boardly Commons
const CommonsFeedPage = lazyWithRetry(() =>
  import('./pages/commons/CommonsFeedPage').then(m => ({ default: m.CommonsFeedPage }))
);
const CommunityGuidelinesPage = lazyWithRetry(() =>
  import('./pages/commons/CommunityGuidelinesPage').then(m => ({ default: m.CommunityGuidelinesPage }))
);
const CommonsAboutPage = lazyWithRetry(() =>
  import('./pages/commons/CommonsAboutPage').then(m => ({ default: m.CommonsAboutPage }))
);
const ZenryuDevPreviewPage = lazyWithRetry(() =>
  import('./components/dashboard/DragonCompanion').then(m => ({ default: m.ZenryuDevPreviewPage }))
);
const StoreItemsDevPreviewPage = lazyWithRetry(() =>
  import('./pages/store/StoreItemsDevPreviewPage').then(m => ({ default: m.StoreItemsDevPreviewPage }))
);

import { BoardlySuspenseBoundary } from './components/ui/BoardlyLoader';
import { AuthGateProvider } from './contexts/AuthGateContext';
import { KobanStyleProvider } from './contexts/KobanStyleContext';
import { ProBadgeProvider } from './contexts/ProBadgeContext';

function AppInner() {
  useReferralCapture();

  return (
    <DashboardErrorBoundary fallbackTitle="Boardly encountered an issue">
      <WallpaperBackground />
      <ScrollToTop />
      <BoardlySuspenseBoundary variant="overlay">
      <Routes>
        {import.meta.env.DEV && (
          <Route path="/dev/zenryu" element={<ZenryuDevPreviewPage />} />
        )}
        <Route path="/dev/store-items" element={<StoreItemsDevPreviewPage />} />
        {/* Test Engine — full-screen distraction-free, no Navbar/Footer */}
        <Route path="/test" element={<Navigate to="/dashboard/practice" replace />} />
        <Route path="/test/:attemptId/result" element={<TestResultPage />} />
        <Route path="/test/:attemptId" element={<TestRunnerPage />} />
        <Route path="/results/:attemptId" element={<TestResultPage />} />
        <Route path="/grand-line/test/:testId/run" element={<GrandLineTestRunnerPage />} />
        <Route path="/grand-line/test/:testId/result" element={<GrandLineTestRunnerPage />} />
        <Route path="/grand-line/test/:testId/redo" element={<GrandLineTestRunnerPage />} />
        <Route path="/grand-line/test/:testId/retake" element={<GrandLineTestRunnerPage />} />
        <Route path="/grand-line/tests/:testId/run" element={<GrandLineTestRunnerPage />} />
        <Route path="/grand-line/tests/:testId/result" element={<GrandLineTestRunnerPage />} />
        <Route path="/grand-line/tests/:testId/redo" element={<GrandLineTestRunnerPage />} />
        <Route path="/grand-line/tests/:testId/retake" element={<GrandLineTestRunnerPage />} />
        <Route path="/tests/:testId/run" element={<GrandLineTestRunnerPage />} />
        <Route path="/tests/:testId/result" element={<GrandLineTestRunnerPage />} />
        <Route path="/tests/:testId/redo" element={<GrandLineTestRunnerPage />} />
        <Route path="/tests/:testId/retake" element={<GrandLineTestRunnerPage />} />

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
          <Route path="pricing" element={<AdminPricingPage />} />
          <Route path="questions" element={<AdminQuestionsPage />} />
          <Route path="applications" element={<AdminApplicationsPage />} />
          <Route path="payments" element={<AdminPaymentsPage />} />
          <Route path="kobans" element={<AdminKobansPage />} />
          <Route path="wallets" element={<AdminKobansPage />} />
          <Route path="wallets/:uid" element={<AdminKobansPage />} />
          <Route path="announcements" element={<AdminAnnouncementsPage />} />
          <Route path="bots" element={<AdminBotsPage />} />
          <Route path="captains" element={<AdminCaptainsPage />} />
          <Route path="audit-logs" element={<AdminAuditLogsPage />} />
          <Route path="crews" element={<AdminCrewsPage />} />
          <Route path="commons" element={<AdminCommonsPage />} />
          <Route path="reviews" element={<AdminCommonsPage />} />
          <Route path="certificates" element={<AdminCertificatesPage />} />
          <Route path="signatures" element={<AdminCertificatesPage />} />
          <Route path="settings" element={<AdminCertificatesPage />} />
          <Route path="access-requests" element={<AdminAccessRequestsPage />} />
          <Route path="health" element={<AdminHealthPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Dashboard shell (Student Portal) — Login-only, noindex */}
        <Route path="/dashboard" element={<DashboardShell />}>
          <Route index element={<OverviewPage />} />
          <Route path="commons" element={<CommonsFeedPage />} />
          <Route path="practice" element={<PracticePage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="weak-chapters" element={<Navigate to="/dashboard/notifications" replace />} />
          <Route path="streaks" element={<StreaksPage />} />
          <Route path="history" element={<ResultsListPage />} />
          <Route path="history/:attemptId" element={<TestResultPage />} />
          <Route path="results" element={<ResultsListPage />} />
          <Route path="results/:attemptId" element={<TestResultPage />} />
          <Route path="certificates" element={<MyCertificatesPage />} />
          <Route path="store" element={<StorePage />} />
          <Route path="rewards" element={<Navigate to="/rewards" replace />} />
          <Route path="past-papers" element={<PlaceholderPage title="Past Papers" />} />
          <Route path="arena" element={<ArenaDashboardPage />} />
          <Route path="ai-tutor" element={<AiTutorPage />} />
          <Route path="merit-meter" element={<PlaceholderPage title="Merit Meter" />} />
          <Route path="study-circles" element={<PlaceholderPage title="Study Circles" />} />
          <Route path="crew" element={<CrewDashboardPage />} />
          <Route path="captain" element={<AmbassadorDashboardPage />} />
          <Route path="ambassador" element={<AmbassadorDashboardPage />} />
          <Route path="plans" element={<PlansBillingPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="settings/:subPage" element={<SettingsPage />} />
          <Route path="menu" element={<OverviewPage />} />
          <Route path="contact" element={<Navigate to="/contact" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Dedicated Login-Only Top-Level Routes (wrapped in DashboardShell, noindex) */}
        <Route path="/practice" element={<DashboardShell />}>
          <Route index element={<PracticePage />} />
        </Route>
        <Route path="/results" element={<DashboardShell />}>
          <Route index element={<ResultsListPage />} />
        </Route>
        <Route path="/certificates" element={<DashboardShell />}>
          <Route index element={<MyCertificatesPage />} />
        </Route>
        <Route path="/commons/new" element={<DashboardShell />}>
          <Route index element={<CommonsFeedPage initialCompose={true} />} />
        </Route>
        <Route path="/messages" element={<DashboardShell />}>
          <Route index element={<MessagesPage />} />
        </Route>
        <Route path="/notifications" element={<DashboardShell />}>
          <Route index element={<NotificationsPage />} />
        </Route>
        <Route path="/saved" element={<DashboardShell />}>
          <Route index element={<CommonsFeedPage />} />
        </Route>
        <Route path="/settings" element={<DashboardShell />}>
          <Route index element={<SettingsPage />} />
          <Route path=":subPage" element={<SettingsPage />} />
        </Route>
        <Route path="/menu" element={<DashboardShell />}>
          <Route index element={<OverviewPage />} />
        </Route>
        <Route path="/profile/edit" element={<DashboardShell />}>
          <Route index element={<ProfilePage />} />
        </Route>
        <Route path="/wallet" element={<DashboardShell />}>
          <Route index element={<PlansBillingPage />} />
        </Route>
        <Route path="/checkout" element={<DashboardShell />}>
          <Route index element={<PlansBillingPage />} />
        </Route>

        {/* Global shortcuts for plans and profile */}
        <Route path="/plans" element={<Navigate to="/dashboard/plans" replace />} />
        <Route path="/profile" element={<Navigate to="/dashboard/profile" replace />} />
        <Route path="/commons/contact" element={<Navigate to="/contact" replace />} />

        {/* Auth routes ONLY (use AuthLayout ONLY, NO public Navbar or Footer) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        {/* Onboarding — uses OnboardingShell */}
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* Crew Login-Only Routes */}
        <Route path="/crew/my" element={<DashboardShell />}>
          <Route index element={<CrewDashboardPage />} />
        </Route>
        <Route path="/crew/dashboard" element={<DashboardShell />}>
          <Route index element={<CrewDashboardPage />} />
        </Route>
        <Route path="/crews" element={<Navigate to="/crew" replace />} />
        <Route path="/join" element={<Navigate to="/crew" replace />} />

        {/* Nakama Captain Shortcuts */}
        <Route path="/captain" element={<Navigate to="/dashboard/captain" replace />} />
        <Route path="/captain/dashboard" element={<Navigate to="/dashboard/captain" replace />} />
        <Route path="/nakama-captain" element={<Navigate to="/captains" replace />} />
        <Route path="/crew-ambassador" element={<Navigate to="/captains" replace />} />
        <Route path="/ambassador" element={<Navigate to="/captains" replace />} />

        {/* Public & Session-Aware Routes (PublicLayout when signed-out, AppLayout without Footer when signed-in) */}
        <Route element={<PublicLayout />}>
          {/* Home, About, Features, How It Works, FAQ, Pricing, Legal, Contact */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/practice/:subject" element={<McqSubjectPage />} />
          <Route path="/practice/:subject/:chapter" element={<McqChapterPage />} />
          <Route path="/practice/:university/:subject/:chapter" element={<McqChapterPage />} />
          <Route path="/crew" element={<CrewPage />} />
          <Route path="/crew/apply" element={<CrewApplyPage />} />
          <Route path="/join/:code" element={<JoinCrewPage />} />
          <Route path="/captain/apply" element={<CaptainApplyPage />} />
          <Route path="/captains/apply" element={<CaptainApplyPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/guidelines" element={<CommunityGuidelinesPage />} />
          <Route path="/commons/guidelines" element={<CommunityGuidelinesPage />} />

          {/* Public MCQ Subject, University & Chapter Pages */}
          <Route path="/mcqs" element={<McqsHubPage />} />
          <Route path="/mcqs/:subject" element={<McqSubjectPage />} />
          <Route path="/mcqs/:subject/:chapter" element={<McqChapterPage />} />
          <Route path="/mcqs/:university/:subject/:chapter" element={<McqChapterPage />} />

          {/* Public Subjects Hub, Subject Detail & Chapter Pages */}
          <Route path="/subjects" element={<McqsHubPage />} />
          <Route path="/subjects/:subjectId" element={<McqSubjectPage />} />
          <Route path="/subjects/:subjectId/:chapter" element={<McqChapterPage />} />

          {/* Public Boardly Commons Feed, Post Permalinks, Subject Feeds & Info */}
          <Route path="/commons" element={<CommonsFeedPage />} />
          <Route path="/commons/trending" element={<CommonsFeedPage />} />
          <Route path="/commons/following" element={<CommonsFeedPage />} />
          <Route path="/commons/about" element={<CommonsAboutPage />} />
          <Route path="/about-commons" element={<Navigate to="/commons/about" replace />} />
          <Route path="/commons/post/:idSlug" element={<PublicPostDetailPage />} />
          <Route path="/commons/subject/:subject" element={<CommonsSubjectPage />} />

          {/* Public Study Material Library, Subject Pages & Material Detail Pages */}
          <Route path="/material" element={<MaterialLibraryPage />} />
          <Route path="/material/subject/:subject" element={<MaterialSubjectPage />} />
          <Route path="/material/:idSlug" element={<MaterialDetailPage />} />
          <Route path="/study-material" element={<MaterialLibraryPage />} />
          <Route path="/study-material/subject/:subject" element={<MaterialSubjectPage />} />
          <Route path="/study-material/:itemId" element={<MaterialDetailPage />} />

          {/* Public Grand Line, Test Info & Leaderboard */}
          <Route path="/leaderboard" element={<GrandLineLeaderboardPage />} />
          <Route path="/grand-line" element={<GrandLinePage />} />
          <Route path="/grand-line/about" element={<GrandLineAboutPage />} />
          <Route path="/grand-line/leaderboard" element={<GrandLineLeaderboardPage />} />
          <Route path="/grand-line/test/:idSlug" element={<GrandLineTestInfoPage />} />
          <Route path="/grand-line/tests/:idSlug" element={<GrandLineTestInfoPage />} />
          <Route path="/tests" element={<Navigate to="/grand-line" replace />} />
          <Route path="/tests/:idSlug" element={<GrandLineTestInfoPage />} />
          <Route path="/verify" element={<VerifyCertificatePage />} />
          <Route path="/verify/:serial" element={<VerifyCertificatePage />} />
          <Route path="/arena" element={<ArenaPage />} />

          {/* Public Nakama Captains Overview, Leaderboard & Public Captain Profiles */}
          <Route path="/captains" element={<NakamaCaptainsPage />} />
          <Route path="/nakama-captains" element={<NakamaCaptainsPage />} />
          <Route path="/captain/leaderboard" element={<CaptainLeaderboardPage />} />
          <Route path="/captains/leaderboard" element={<CaptainLeaderboardPage />} />
          <Route path="/captains/:username" element={<CaptainPublicProfilePage />} />

          {/* Public Study Crew Detail Page */}
          <Route path="/crew/:idSlug" element={<CrewPublicDetailPage />} />

          {/* Public Store, Rewards & Cosmetic Item Detail Pages */}
          <Route path="/rewards" element={<RewardsPage />} />
          <Route path="/store" element={<StorePage />} />
          <Route path="/store/get-kobans" element={<StorePage />} />
          <Route path="/store/item/:item" element={<StoreItemDetailPage />} />
          <Route path="/store/:item" element={<StoreItemDetailPage />} />
          <Route path="/kobans" element={<KobansPage />} />
          <Route path="/about-kobans" element={<Navigate to="/kobans" replace />} />

          {/* Public User Profile & Search */}
          <Route path="/u/:username" element={<PublicUserProfilePage />} />
          <Route path="/profile/:userId" element={<PublicUserProfilePage />} />
          <Route path="/user/:userId" element={<PublicUserProfilePage />} />
          <Route path="/users/:userId" element={<PublicUserProfilePage />} />
          <Route path="/search" element={<SearchPage />} />

          {/* Custom 410 Gone & 404 Not Found Pages */}
          <Route path="/410" element={<GonePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BoardlySuspenseBoundary>
    <ProfileModalHost />
    {import.meta.env.DEV && (
      <Suspense fallback={null}>
        <LazyDebugPanel />
      </Suspense>
    )}
    </DashboardErrorBoundary>
  );
}

export function App() {
  return (
    <AuthProvider>
      <KobanStyleProvider>
        <ProBadgeProvider>
          <ProfileModalProvider>
            <AuthGateProvider>
              <AppInner />
            </AuthGateProvider>
          </ProfileModalProvider>
        </ProBadgeProvider>
      </KobanStyleProvider>
    </AuthProvider>
  );
}

export default App;


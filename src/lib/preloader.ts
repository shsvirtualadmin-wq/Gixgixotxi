import { preloadComponent } from './lazyWithRetry';

/**
 * Screen component loaders registry for background preloading.
 */
export const SCREEN_LOADERS = {
  AdminDashboard: () => import('../components/AdminDashboardScreen').then((m) => ({ default: m.AdminDashboardScreen })),
  ClassStream: () => import('../components/ClassStreamDashboard').then((m) => ({ default: m.ClassStreamDashboard })),
  Subject: () => import('../components/SubjectScreen').then((m) => ({ default: m.SubjectScreen })),
  Duration: () => import('../components/DurationScreen').then((m) => ({ default: m.DurationScreen })),
  GradesFlow: () => import('../components/GradesFlowScreen').then((m) => ({ default: m.GradesFlowScreen })),
  ClassGroup: () => import('../components/ClassGroupScreen').then((m) => ({ default: m.ClassGroupScreen })),
  StudentProfileView: () => import('../components/StudentProfileView').then((m) => ({ default: m.StudentProfileView })),
  Pricing: () => import('../components/PricingPage').then((m) => ({ default: m.PricingPage })),
  PlanSelection: () => import('../components/PlanSelectionScreen').then((m) => ({ default: m.PlanSelectionScreen })),
  PaymentRequired: () => import('../components/PaymentRequiredScreen').then((m) => ({ default: m.PaymentRequiredScreen })),
  LmsAuth: () => import('../components/LmsAuthScreen').then((m) => ({ default: m.LmsAuthScreen })),
  GuidedSetup: () => import('../components/GuidedSetupWizard').then((m) => ({ default: m.GuidedSetupWizard })),
  Registration: () => import('../components/StudentRegistrationFlow').then((m) => ({ default: m.StudentRegistrationFlow })),
};

let hasPreloadedHighPriority = false;
let hasPreloadedAll = false;

/**
 * Preloads the highest probability student screens immediately after mount.
 * (Subject, Duration, GradesFlow, ClassStream, Profile)
 */
export function preloadStudentCoreScreens() {
  if (hasPreloadedHighPriority) return;
  hasPreloadedHighPriority = true;

  try {
    preloadComponent(SCREEN_LOADERS.Subject, 'Subject');
    preloadComponent(SCREEN_LOADERS.Duration, 'Duration');
    preloadComponent(SCREEN_LOADERS.ClassStream, 'ClassStream');
    preloadComponent(SCREEN_LOADERS.GradesFlow, 'GradesFlow');
    preloadComponent(SCREEN_LOADERS.StudentProfileView, 'StudentProfileView');
  } catch {}
}

/**
 * Preloads the Admin Dashboard screen chunk immediately when admin role is identified.
 */
export function preloadAdminScreen() {
  try {
    preloadComponent(SCREEN_LOADERS.AdminDashboard, 'AdminDashboard');
  } catch {}
}

/**
 * Idle-time preloader that prepares all remaining app chunks in background
 * so any click from the student dashboard opens in 0-1 seconds without delays or white screens.
 */
export function preloadAllAppScreens() {
  if (hasPreloadedAll) return;
  hasPreloadedAll = true;

  const run = () => {
    Object.entries(SCREEN_LOADERS).forEach(([name, loader]) => {
      try {
        preloadComponent(loader as any, name);
      } catch {}
    });
  };

  if (typeof window !== 'undefined') {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(run, { timeout: 2000 });
    } else {
      setTimeout(run, 300);
    }
  }
}

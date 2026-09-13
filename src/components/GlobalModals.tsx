import React, { Suspense, useEffect } from 'react';
import { useModals } from '../context/ModalContext';
import { User, StudentProfile, fetchStudentProfileFromSupabase } from '../lib/supabase';
import { HistoryItem } from '../types';
import { lazyWithRetry } from '../lib/lazyWithRetry';
import { ChunkErrorBoundary } from './ChunkErrorBoundary';

// Lazy load modals with auto-retry and chunk recovery
const StudyBuddyModal = lazyWithRetry(
  () => import('./StudyBuddyModal').then((m) => ({ default: m.StudyBuddyModal })),
  'StudyBuddyModal'
);
const LmsPortalModal = lazyWithRetry(
  () => import('./LmsPortalModal').then((m) => ({ default: m.LmsPortalModal })),
  'LmsPortalModal'
);
const HistoryModal = lazyWithRetry(
  () => import('./HistoryModal').then((m) => ({ default: m.HistoryModal })),
  'HistoryModal'
);
const CommunityModal = lazyWithRetry(
  () => import('./CommunityModal').then((m) => ({ default: m.CommunityModal })),
  'CommunityModal'
);
const PrintableTestModal = lazyWithRetry(
  () => import('./PrintableTestModal').then((m) => ({ default: m.PrintableTestModal })),
  'PrintableTestModal'
);
const PaymentProofModal = lazyWithRetry(
  () => import('./PaymentProofModal').then((m) => ({ default: m.PaymentProofModal })),
  'PaymentProofModal'
);
const TestLimitModal = lazyWithRetry(
  () => import('./TestLimitModal').then((m) => ({ default: m.TestLimitModal })),
  'TestLimitModal'
);

interface GlobalModalsProps {
  currentUser: User | null;
  userProfile: StudentProfile | null;
  setUserProfile: React.Dispatch<React.SetStateAction<StudentProfile | null>>;
  history: HistoryItem[];
  handleClearHistory: () => void;
  isTestLimitReached: boolean;
  refreshUserProfile: () => Promise<void>;
  selectedClass?: string | number;
  selectedGroup?: string;
  selectedSubject?: string;
  customTopic?: string;
  screen: string;
  setScreen: (screen: any) => void;
}

export const GlobalModals: React.FC<GlobalModalsProps> = React.memo(({
  currentUser,
  userProfile,
  setUserProfile,
  history,
  handleClearHistory,
  isTestLimitReached,
  refreshUserProfile,
  selectedClass,
  selectedGroup,
  selectedSubject,
  customTopic,
  screen,
  setScreen,
}) => {
  const {
    showCommunityModal,
    closeCommunityModal,
    showHistoryModal,
    closeHistoryModal,
    showPrintModal,
    closePrintModal,
    showLmsModal,
    closeLmsModal,
    showPaymentModal,
    closePaymentModal,
    showTestLimitModal,
    closeTestLimitModal,
    showStudyBuddy,
    closeStudyBuddy,
    testResult,
    paymentOverrides,
    testLimitData,
    studyBuddyContext,
    setStudyBuddyContext,
    openPaymentModal,
  } = useModals();

  // Preload StudyBuddyModal chunk during idle time so it opens instantly without network delay
  useEffect(() => {
    const preload = () => {
      import('./StudyBuddyModal').catch(() => {});
    };
    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(preload, { timeout: 3000 });
      } else {
        setTimeout(preload, 1200);
      }
    }
  }, []);

  return (
    <ChunkErrorBoundary fallback={null}>
      <Suspense fallback={null}>
        {/* Study Buddy Chatbot */}
        {showStudyBuddy && (
          <StudyBuddyModal
            isOpen={showStudyBuddy}
            onClose={closeStudyBuddy}
            preloadedContext={studyBuddyContext}
            onClearPreloadedContext={() => setStudyBuddyContext(null)}
            studentProfile={userProfile}
            selectedClass={selectedClass}
            selectedGroup={selectedGroup}
            selectedSubject={selectedSubject}
            customTopic={customTopic}
            hideFloatingButton={screen === 'test'}
            onUpgradeClick={() => setScreen('plan_selection')}
          />
        )}

      {showLmsModal && (
        <LmsPortalModal
          currentUser={currentUser}
          userProfile={userProfile}
          isTestLimitReached={isTestLimitReached}
          onClose={() => {
            closeLmsModal();
            closeStudyBuddy();
            if (screen === 'profile') {
              setScreen('dashboard');
            }
          }}
          onRefreshProfile={() => refreshUserProfile()}
          onStartPractice={() => {
            closeLmsModal();
            setScreen('grades_flow');
          }}
          onOpenAdminDashboard={() => {
            closeLmsModal();
            setScreen('admin');
          }}
        />
      )}

      {showHistoryModal && (
        <HistoryModal
          history={history}
          onClearHistory={handleClearHistory}
          onClose={closeHistoryModal}
        />
      )}

      {showCommunityModal && (
        <CommunityModal onClose={closeCommunityModal} />
      )}

      {showPrintModal && testResult && (
        <PrintableTestModal
          result={testResult}
          currentUser={currentUser}
          userProfile={userProfile}
          onClose={closePrintModal}
          onUpgradeClick={() => {
            closePrintModal();
            setScreen('plan_selection');
          }}
        />
      )}

      {showPaymentModal && currentUser && (
        <PaymentProofModal
          isOpen={showPaymentModal}
          onClose={closePaymentModal}
          currentUser={currentUser}
          studentProfile={userProfile}
          selectedTrackOverride={paymentOverrides.track}
          selectedCycleOverride={paymentOverrides.cycle}
          onSubmitted={async () => {
            if (currentUser?.id) {
              const updated = await fetchStudentProfileFromSupabase(currentUser.id, true, currentUser.email);
              if (updated) setUserProfile(updated);
            }
          }}
        />
      )}

      <TestLimitModal
        isOpen={showTestLimitModal}
        onClose={closeTestLimitModal}
        resetDate={testLimitData.resetDate}
        currentUsage={testLimitData.currentUsage}
        onUpgradeClick={() => {
          closeTestLimitModal();
          setScreen('pricing');
        }}
        onSubmitPaymentProofClick={() => {
          closeTestLimitModal();
          openPaymentModal();
        }}
      />
      </Suspense>
    </ChunkErrorBoundary>
  );
});

GlobalModals.displayName = 'GlobalModals';

import React, { Suspense, lazy } from 'react';
import { useModals } from '../context/ModalContext';
import { User, StudentProfile, fetchStudentProfileFromSupabase } from '../lib/supabase';
import { HistoryItem } from '../types';

// Lazy load modals so their code is loaded only when requested
const StudyBuddyModal = lazy(() =>
  import('./StudyBuddyModal').then((m) => ({ default: m.StudyBuddyModal }))
);
const LmsPortalModal = lazy(() =>
  import('./LmsPortalModal').then((m) => ({ default: m.LmsPortalModal }))
);
const HistoryModal = lazy(() =>
  import('./HistoryModal').then((m) => ({ default: m.HistoryModal }))
);
const CommunityModal = lazy(() =>
  import('./CommunityModal').then((m) => ({ default: m.CommunityModal }))
);
const PrintableTestModal = lazy(() =>
  import('./PrintableTestModal').then((m) => ({ default: m.PrintableTestModal }))
);
const PaymentProofModal = lazy(() =>
  import('./PaymentProofModal').then((m) => ({ default: m.PaymentProofModal }))
);
const TestLimitModal = lazy(() =>
  import('./TestLimitModal').then((m) => ({ default: m.TestLimitModal }))
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

  return (
    <Suspense fallback={null}>
      {/* Study Buddy Chatbot */}
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
  );
});

GlobalModals.displayName = 'GlobalModals';

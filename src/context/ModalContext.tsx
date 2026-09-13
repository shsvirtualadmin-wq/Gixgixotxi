import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import { TestResult, MCQContext } from '../types';

export interface ModalState {
  showCommunityModal: boolean;
  showHistoryModal: boolean;
  showPrintModal: boolean;
  showLmsModal: boolean;
  showPaymentModal: boolean;
  showTestLimitModal: boolean;
  showStudyBuddy: boolean;
  
  // Modal-specific payload data
  testResult: TestResult | null;
  paymentOverrides: { track?: string; cycle?: string };
  testLimitData: { resetDate: string; currentUsage: number };
  studyBuddyContext: MCQContext | null;
}

export interface ModalContextType extends ModalState {
  openCommunityModal: () => void;
  closeCommunityModal: () => void;
  
  openHistoryModal: () => void;
  closeHistoryModal: () => void;
  
  openPrintModal: (result: TestResult) => void;
  closePrintModal: () => void;
  
  openLmsModal: () => void;
  closeLmsModal: () => void;
  
  openPaymentModal: (trackOverride?: string, cycleOverride?: string) => void;
  closePaymentModal: () => void;
  
  openTestLimitModal: (resetDate?: string, currentUsage?: number) => void;
  closeTestLimitModal: () => void;
  
  openStudyBuddy: (context?: MCQContext | null) => void;
  closeStudyBuddy: () => void;
  toggleStudyBuddy: () => void;
  setStudyBuddyContext: (context: MCQContext | null) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showLmsModal, setShowLmsModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showTestLimitModal, setShowTestLimitModal] = useState(false);
  const [showStudyBuddy, setShowStudyBuddy] = useState(false);

  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [paymentOverrides, setPaymentOverrides] = useState<{ track?: string; cycle?: string }>({});
  const [testLimitData, setTestLimitData] = useState<{ resetDate: string; currentUsage: number }>({
    resetDate: '',
    currentUsage: 0,
  });
  const [studyBuddyContext, setStudyBuddyContextState] = useState<MCQContext | null>(null);

  // Automatically reopen Study Buddy if page reloaded due to a stale dynamic import/chunk update
  useEffect(() => {
    try {
      if (sessionStorage.getItem('boardly_reopen_study_buddy') === 'true') {
        sessionStorage.removeItem('boardly_reopen_study_buddy');
        setTimeout(() => {
          setShowStudyBuddy(true);
        }, 150);
      }
    } catch {}
  }, []);

  const openCommunityModal = useCallback(() => setShowCommunityModal(true), []);
  const closeCommunityModal = useCallback(() => setShowCommunityModal(false), []);

  const openHistoryModal = useCallback(() => setShowHistoryModal(true), []);
  const closeHistoryModal = useCallback(() => setShowHistoryModal(false), []);

  const openPrintModal = useCallback((result: TestResult) => {
    setTestResult(result);
    setShowPrintModal(true);
  }, []);
  const closePrintModal = useCallback(() => {
    setShowPrintModal(false);
    setTestResult(null);
  }, []);

  const openLmsModal = useCallback(() => setShowLmsModal(true), []);
  const closeLmsModal = useCallback(() => setShowLmsModal(false), []);

  const openPaymentModal = useCallback((trackOverride?: string, cycleOverride?: string) => {
    setPaymentOverrides({ track: trackOverride, cycle: cycleOverride });
    setShowPaymentModal(true);
  }, []);
  const closePaymentModal = useCallback(() => {
    setShowPaymentModal(false);
    setPaymentOverrides({});
  }, []);

  const openTestLimitModal = useCallback((resetDate = '', currentUsage = 2) => {
    // Defense-in-depth: Never open test limit modal if student has completed fewer than 2 tests
    if (typeof currentUsage === 'number' && currentUsage < 2) {
      console.warn(`[openTestLimitModal suppressed]: Student has completed ${currentUsage}/2 tests. Limit not reached.`);
      return;
    }
    setTestLimitData({ resetDate, currentUsage: Math.max(currentUsage, 2) });
    setShowTestLimitModal(true);
  }, []);
  const closeTestLimitModal = useCallback(() => setShowTestLimitModal(false), []);

  const openStudyBuddy = useCallback((context?: MCQContext | null) => {
    if (context) setStudyBuddyContextState(context);
    setShowStudyBuddy(true);
  }, []);
  const closeStudyBuddy = useCallback(() => setShowStudyBuddy(false), []);
  const toggleStudyBuddy = useCallback(() => setShowStudyBuddy((prev) => !prev), []);
  const setStudyBuddyContext = useCallback((context: MCQContext | null) => {
    setStudyBuddyContextState(context);
  }, []);

  const value = useMemo<ModalContextType>(() => ({
    showCommunityModal,
    showHistoryModal,
    showPrintModal,
    showLmsModal,
    showPaymentModal,
    showTestLimitModal,
    showStudyBuddy,
    testResult,
    paymentOverrides,
    testLimitData,
    studyBuddyContext,
    openCommunityModal,
    closeCommunityModal,
    openHistoryModal,
    closeHistoryModal,
    openPrintModal,
    closePrintModal,
    openLmsModal,
    closeLmsModal,
    openPaymentModal,
    closePaymentModal,
    openTestLimitModal,
    closeTestLimitModal,
    openStudyBuddy,
    closeStudyBuddy,
    toggleStudyBuddy,
    setStudyBuddyContext,
  }), [
    showCommunityModal,
    showHistoryModal,
    showPrintModal,
    showLmsModal,
    showPaymentModal,
    showTestLimitModal,
    showStudyBuddy,
    testResult,
    paymentOverrides,
    testLimitData,
    studyBuddyContext,
    openCommunityModal,
    closeCommunityModal,
    openHistoryModal,
    closeHistoryModal,
    openPrintModal,
    closePrintModal,
    openLmsModal,
    closeLmsModal,
    openPaymentModal,
    closePaymentModal,
    openTestLimitModal,
    closeTestLimitModal,
    openStudyBuddy,
    closeStudyBuddy,
    toggleStudyBuddy,
    setStudyBuddyContext,
  ]);

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
};

export const useModals = (): ModalContextType => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModals must be used within a ModalProvider');
  }
  return context;
};

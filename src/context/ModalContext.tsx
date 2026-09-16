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

  const openPaymentModal = useCallback((_trackOverride?: string, _cycleOverride?: string) => {
    // Decommissioned: Boardly is 100% free and open for all students
    setShowPaymentModal(false);
  }, []);
  const closePaymentModal = useCallback(() => {
    setShowPaymentModal(false);
    setPaymentOverrides({});
  }, []);

  const openTestLimitModal = useCallback((_resetDate = '', _currentUsage = 0) => {
    // Decommissioned: Boardly has unlimited practice tests for all students
    setShowTestLimitModal(false);
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

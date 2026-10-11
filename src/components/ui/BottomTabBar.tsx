import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Target,
  Sparkles,
  TrendingUp,
  MoreHorizontal,
} from 'lucide-react';

export type StudentTabId = 'overview' | 'practice' | 'boardy' | 'history' | 'more';

export interface BottomTabBarProps {
  activeTab: string;
  onSelectTab: (tabId: StudentTabId) => void;
  onOpenMore: () => void;
  isInputFocused?: boolean;
  isInTestSession?: boolean;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onSelectTab,
  onOpenMore,
  isInputFocused = false,
  isInTestSession = false,
}) => {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Detect virtual keyboard on mobile via visualViewport resize
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleResize = () => {
      if (window.visualViewport) {
        // If the visual viewport height is substantially smaller than window height, keyboard is up
        const isUp = window.visualViewport.height < window.innerHeight * 0.75;
        setIsKeyboardOpen(isUp);
      }
    };

    window.visualViewport.addEventListener('resize', handleResize);
    return () => window.visualViewport?.removeEventListener('resize', handleResize);
  }, []);

  // Hide the bar while the keyboard is open, input is focused, or during a test session
  if (isInTestSession || isInputFocused || isKeyboardOpen) {
    return null;
  }

  const tabs = [
    { id: 'overview' as StudentTabId, label: 'Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'practice' as StudentTabId, label: 'Practice', icon: <Target className="w-5 h-5" /> },
    { id: 'history' as StudentTabId, label: 'Test History', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'boardy' as StudentTabId, label: 'Boardy AI', icon: <Sparkles className="w-5 h-5" /> },
    { id: 'more' as StudentTabId, label: 'More', icon: <MoreHorizontal className="w-5 h-5" /> },
  ];

  return (
    <nav className="lg:hidden fixed bottom-3 left-3 right-3 z-40 bg-white/85 backdrop-blur-2xl border border-white/80 rounded-3xl px-2 py-1.5 flex items-center justify-around shadow-2xl shadow-indigo-950/10 safe-area-bottom">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              if (tab.id === 'more') {
                onOpenMore();
              } else {
                onSelectTab(tab.id);
              }
            }}
            className={`min-w-[48px] min-h-[48px] flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all cursor-pointer ${
              isActive
                ? 'text-indigo-600 font-extrabold scale-105'
                : 'text-slate-400 hover:text-slate-700 font-semibold'
            }`}
          >
            <div className={`p-1 rounded-xl ${isActive ? 'bg-indigo-50 text-indigo-600' : ''}`}>
              {tab.icon}
            </div>
            <span className="text-[10px] tracking-tight whitespace-nowrap">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

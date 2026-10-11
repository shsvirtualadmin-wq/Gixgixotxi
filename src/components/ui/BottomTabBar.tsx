import React from 'react';
import {
  LayoutDashboard,
  Target,
  Sparkles,
  TrendingUp,
  User,
} from 'lucide-react';

export type StudentTabId = 'overview' | 'practice' | 'boardy' | 'history' | 'profile';

export interface BottomTabBarProps {
  activeTab: StudentTabId | string;
  onSelectTab: (tabId: StudentTabId) => void;
  onOpenProfile?: () => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onSelectTab,
  onOpenProfile,
}) => {
  const tabs = [
    { id: 'overview' as StudentTabId, label: 'Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'practice' as StudentTabId, label: 'Practice', icon: <Target className="w-5 h-5" /> },
    { id: 'boardy' as StudentTabId, label: 'Boardy AI', icon: <Sparkles className="w-5 h-5" /> },
    { id: 'history' as StudentTabId, label: 'Test History', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'profile' as StudentTabId, label: 'Profile', icon: <User className="w-5 h-5" /> },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-t border-slate-200/90 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-bottom">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              if (tab.id === 'profile' && onOpenProfile) {
                onOpenProfile();
              } else {
                onSelectTab(tab.id);
              }
            }}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all cursor-pointer ${
              isActive
                ? 'text-indigo-600 dark:text-violet-400 font-extrabold scale-105'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-semibold'
            }`}
          >
            <div className={`p-1 rounded-xl ${isActive ? 'bg-indigo-50 dark:bg-violet-950/60' : ''}`}>
              {tab.icon}
            </div>
            <span className="text-[10px] tracking-tight whitespace-nowrap">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

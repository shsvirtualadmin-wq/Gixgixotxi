import React from 'react';
import {
  LayoutDashboard,
  Target,
  Calendar,
  MessageSquare,
  MoreHorizontal,
} from 'lucide-react';

export type StudentTabId = 'overview' | 'practice' | 'events' | 'boardy' | 'more';

export interface BottomTabBarProps {
  activeTab: StudentTabId | string;
  onSelectTab: (tabId: StudentTabId) => void;
  onOpenMoreSheet: () => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onSelectTab,
  onOpenMoreSheet,
}) => {
  const tabs = [
    { id: 'overview' as StudentTabId, label: 'Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'practice' as StudentTabId, label: 'Practice', icon: <Target className="w-5 h-5" /> },
    { id: 'events' as StudentTabId, label: 'Events', icon: <Calendar className="w-5 h-5" /> },
    { id: 'boardy' as StudentTabId, label: 'Boardy', icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'more' as StudentTabId, label: 'More', icon: <MoreHorizontal className="w-5 h-5" /> },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl border-t border-slate-200/90 dark:border-slate-800 px-3 py-1.5 flex items-center justify-around shadow-2xl">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              if (tab.id === 'more') {
                onOpenMoreSheet();
              } else {
                onSelectTab(tab.id);
              }
            }}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
              isActive
                ? 'text-indigo-600 dark:text-violet-400 font-extrabold scale-105'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-semibold'
            }`}
          >
            <div className={`p-1 rounded-xl ${isActive ? 'bg-indigo-50 dark:bg-violet-950/60' : ''}`}>
              {tab.icon}
            </div>
            <span className="text-[10px] tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

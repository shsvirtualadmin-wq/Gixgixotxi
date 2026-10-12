import React, { useEffect, useRef } from 'react';
import {
  Swords,
  Map,
  Vault,
  FileText,
  TrendingUp,
  Clock,
  Sparkles,
  Calculator,
  Compass,
  Shield,
  LogOut,
  ChevronRight,
  User,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getPlanConfig } from '../../data/planLimits';

interface MoreBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
  onNavigateUrl?: (url: string) => void;
}

export const MoreBottomSheet: React.FC<MoreBottomSheetProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onNavigateUrl,
}) => {
  const { user, profile, isAdmin, logOut } = useAuth();
  const planConfig = getPlanConfig(profile?.plan);
  const sheetRef = useRef<HTMLDivElement | null>(null);

  // Close on Esc
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const displayName = profile?.name || profile?.fullName || user?.displayName || 'Boardly Aspirant';
  const initial = displayName.charAt(0).toUpperCase();
  const userEmail = user?.email || profile?.email || 'student@boardly.cfd';

  // 4-column grid of rounded icon tiles (2 rows):
  // 1. Arena, 2. Chapter Map, 3. Formula Vault, 4. Paper Vault (Beta)
  // 5. Growth, 6. Daily Limits, 7. Smart Planner (Beta), 8. Merit Meter
  const tiles: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
    beta?: boolean;
    onClick: () => void;
  }> = [
    {
      id: 'arena',
      label: 'Arena',
      icon: <Swords className="w-5 h-5 text-indigo-600" />,
      onClick: () => {
        onClose();
        onNavigateTab('arena');
      },
    },
    {
      id: 'chapter-map',
      label: 'Chapter Map',
      icon: <Map className="w-5 h-5 text-indigo-600" />,
      onClick: () => {
        onClose();
        onNavigateTab('chapter-map');
      },
    },
    {
      id: 'formula-vault',
      label: 'Formula Vault',
      icon: <Sparkles className="w-5 h-5 text-amber-500" />,
      onClick: () => {
        onClose();
        onNavigateTab('formula-vault');
      },
    },
    {
      id: 'paper-vault',
      label: 'Paper Vault',
      beta: true,
      icon: <FileText className="w-5 h-5 text-blue-600" />,
      onClick: () => {
        onClose();
        onNavigateTab('paper-vault');
      },
    },
    {
      id: 'growth',
      label: 'Growth',
      icon: <TrendingUp className="w-5 h-5 text-emerald-600" />,
      onClick: () => {
        onClose();
        onNavigateTab('growth');
      },
    },
    {
      id: 'limits',
      label: 'Daily Limits',
      icon: <Clock className="w-5 h-5 text-indigo-600" />,
      onClick: () => {
        onClose();
        onNavigateTab('limits');
      },
    },
    {
      id: 'smart-planner',
      label: 'Smart Planner',
      beta: true,
      icon: <Sparkles className="w-5 h-5 text-purple-600" />,
      onClick: () => {
        onClose();
        onNavigateTab('smart-planner');
      },
    },
    {
      id: 'merit-meter',
      label: 'Merit Meter',
      icon: <Calculator className="w-5 h-5 text-indigo-600" />,
      onClick: () => {
        onClose();
        onNavigateTab('merit-meter');
      },
    },
  ];

  return (
    <>
      {/* Dim backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-[2px] transition-opacity duration-200"
        aria-hidden="true"
      />

      {/* Slide-up bottom sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="More Options Menu"
        className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-2xl rounded-t-[32px] border-t border-white shadow-2xl p-5 pb-8 sm:pb-10 max-h-[85dvh] overflow-y-auto animate-in slide-in-from-bottom duration-250 safe-area-bottom max-w-lg mx-auto"
      >
        {/* Drag handle */}
        <div
          onClick={onClose}
          className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-4 cursor-pointer"
        />

        {/* Header row: round avatar, name, "<Plan> plan · <email>", and Profile link */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 mb-5">
          <div className="flex items-center gap-3 min-w-0">
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={displayName}
                className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                {initial}
              </div>
            )}
            <div className="min-w-0">
              <h4 className="font-extrabold text-sm text-[#0d1b3e] truncate">
                {displayName}
              </h4>
              <p className="text-[11px] text-slate-500 truncate font-medium">
                {planConfig.name} plan · {userEmail}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigateTab('profile');
            }}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors shrink-0 cursor-pointer shadow-xs"
          >
            Profile
          </button>
        </div>

        {/* 4-column grid of rounded icon tiles (2 rows) */}
        <div className="grid grid-cols-4 gap-2.5 mb-5">
          {tiles.map((tile) => (
            <button
              key={tile.id}
              type="button"
              onClick={tile.onClick}
              className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white hover:bg-indigo-50/70 border border-slate-100 hover:border-indigo-100 shadow-xs transition-all cursor-pointer min-h-[78px] text-center"
            >
              <div className="p-1.5 rounded-xl bg-slate-50 mb-1">
                {tile.icon}
              </div>
              <span className="text-[10px] font-bold text-[#0d1b3e] leading-tight line-clamp-2">
                {tile.label}
              </span>
              {tile.beta && (
                <span className="text-[8px] font-extrabold text-indigo-600 bg-indigo-50 px-1 rounded-sm mt-0.5">
                  Beta
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Below the grid actions */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          {/* University Explorer row */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigateTab('universities');
            }}
            className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Compass className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[#0d1b3e]">
                University Explorer
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* Student Corner Community */}
          <a
            href="https://chat.whatsapp.com/FTXFo4P7kct0L047d5zRGy?s=cl&p=a&mlu=4&ilr=4"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-emerald-50 text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <MessageCircle className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[#0d1b3e]">
                Join the Student Corner Community
              </span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          </a>

          {/* Direct Support (SHS Virtual Academy) */}
          <a
            href="https://wa.me/923058969050"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-emerald-50 text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <MessageCircle className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[#0d1b3e]">
                Message SHS Virtual Academy on WhatsApp
              </span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          </a>

          {/* Switch to Admin Portal (admins only) */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onNavigateUrl) {
                  onNavigateUrl('/admin');
                } else if (typeof window !== 'undefined') {
                  window.history.pushState({}, '', '/admin');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-[#0d1b3e]">
                  Switch to Admin Portal
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          )}

          {/* Log out (red, uses existing logout function only) */}
          <button
            type="button"
            onClick={() => {
              onClose();
              logOut();
            }}
            className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-rose-50 text-rose-600 text-left transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <LogOut className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold">
              Log out
            </span>
          </button>
        </div>
      </div>
    </>
  );
};

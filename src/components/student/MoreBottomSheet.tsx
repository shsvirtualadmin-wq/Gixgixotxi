import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
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
  Award,
  Lock,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAuthRole } from '../../hooks/useAuthRole';
import { getPlanConfig } from '../../data/planLimits';
import { fetchCaptainRecord, fetchUserCrewApplication, CaptainRecord, CrewApplication, onSnapshot, doc, db } from '../../lib/firebase';
import { CrewApplicationModal } from '../crew/CrewApplicationModal';
import { SetPasswordModal } from '../auth/SetPasswordModal';

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
  const auth = useAuth();
  const { user, profile, isAdmin } = useAuthRole();
  const logOut = auth?.logOut;
  const shouldReduceMotion = useReducedMotion();
  const planConfig = getPlanConfig(profile?.plan);
  const sheetRef = useRef<HTMLDivElement | null>(null);

  const [captainRecord, setCaptainRecord] = useState<CaptainRecord | null>(null);
  const [existingApp, setExistingApp] = useState<CrewApplication | null>(null);
  const [showCrewModal, setShowCrewModal] = useState<boolean>(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordSuccessFlag, setPasswordSuccessFlag] = useState(false);
  const hasPasswordProvider = Boolean(
    passwordSuccessFlag ||
    user?.providerData?.some((p: any) => p.providerId === 'password')
  );

  // Check if user is an approved ambassador (Requirement 1: only for users with approved captains/{uid} doc)
  const isApprovedAmbassador = Boolean(
    !isAdmin &&
    profile?.crewStatus !== 'revoked' &&
    captainRecord?.status !== 'revoked' &&
    (profile?.isCrewMember && profile?.crewStatus === 'approved' || (captainRecord && captainRecord.status === 'approved'))
  );

  const isRevoked = Boolean(
    !isAdmin && (
      profile?.crewStatus === 'revoked' ||
      captainRecord?.status === 'revoked' ||
      existingApp?.status === 'revoked'
    )
  );

  useEffect(() => {
    if (!isOpen || !user?.uid) return;

    if (isAdmin) {
      setCaptainRecord(null);
      setExistingApp(null);
      return;
    }

    const unsub = onSnapshot(doc(db, 'captains', user.uid), (snap) => {
      if (snap.exists()) {
        setCaptainRecord(snap.data() as CaptainRecord);
      } else {
        setCaptainRecord(null);
      }
    });

    fetchUserCrewApplication(user.uid).then((app) => {
      if (app) {
        setExistingApp(app);
      }
    }).catch(console.warn);

    return () => unsub();
  }, [isOpen, user?.uid, isAdmin]);

  // Prefetch Profile chunk as soon as More sheet opens for instant navigation
  useEffect(() => {
    if (isOpen) {
      import('../StudentProfileView').catch(() => {});
    }
  }, [isOpen]);

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

  const displayName = profile?.name || profile?.fullName || user?.displayName || 'Boardly Aspirant';
  const initial = displayName.charAt(0).toUpperCase();
  const userEmail = user?.email || profile?.email || 'student@boardly.cfd';

  const handleTileNavigation = (navigateAction: () => void) => {
    onClose();
    setTimeout(() => {
      navigateAction();
    }, shouldReduceMotion ? 50 : 350);
  };

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
      onClick: () => handleTileNavigation(() => onNavigateTab('arena')),
    },
    {
      id: 'chapter-map',
      label: 'Chapter Map',
      icon: <Map className="w-5 h-5 text-indigo-600" />,
      onClick: () => handleTileNavigation(() => onNavigateTab('chapter-map')),
    },
    {
      id: 'formula-vault',
      label: 'Formula Vault',
      icon: <Sparkles className="w-5 h-5 text-amber-500" />,
      onClick: () => handleTileNavigation(() => onNavigateTab('formula-vault')),
    },
    {
      id: 'paper-vault',
      label: 'Paper Vault',
      beta: true,
      icon: <FileText className="w-5 h-5 text-blue-600" />,
      onClick: () => handleTileNavigation(() => onNavigateTab('paper-vault')),
    },
    {
      id: 'growth',
      label: 'Growth',
      icon: <TrendingUp className="w-5 h-5 text-emerald-600" />,
      onClick: () => handleTileNavigation(() => onNavigateTab('growth')),
    },
    {
      id: 'limits',
      label: 'Daily Limits',
      icon: <Clock className="w-5 h-5 text-indigo-600" />,
      onClick: () => handleTileNavigation(() => onNavigateTab('limits')),
    },
    {
      id: 'smart-planner',
      label: 'Smart Planner',
      beta: true,
      icon: <Sparkles className="w-5 h-5 text-purple-600" />,
      onClick: () => handleTileNavigation(() => onNavigateTab('smart-planner')),
    },
    {
      id: 'merit-meter',
      label: 'Merit Meter',
      icon: <Calculator className="w-5 h-5 text-indigo-600" />,
      onClick: () => handleTileNavigation(() => onNavigateTab('merit-meter')),
    },
  ];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Dim backdrop: fades in and out smoothly */}
            <motion.div
              key="more-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: shouldReduceMotion ? 0.05 : 0.35,
                ease: [0.22, 1, 0.36, 1],
              }}
              onClick={onClose}
              className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-[3px] cursor-pointer"
              aria-hidden="true"
            />

            {/* Slide-up bottom sheet:
                opens in about 500ms with a soft spring (no hard bounce).
                Close takes about 350ms, dragging down also dismisses it.
            */}
            <motion.div
              key="more-sheet"
              ref={sheetRef}
              role="dialog"
              aria-modal="true"
              aria-label="More Options Menu"
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0, bottom: 0.35 }}
              onDragEnd={(_e, info) => {
                if (info.offset.y > 80 || info.velocity.y > 300) {
                  onClose();
                }
              }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{
                type: 'spring',
                damping: 32,
                stiffness: 280,
                mass: 0.9,
                duration: shouldReduceMotion ? 0.05 : 0.5,
              }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-2xl rounded-t-[32px] border-t border-white shadow-2xl p-5 pb-8 sm:pb-10 max-h-[85dvh] overflow-y-auto safe-area-bottom max-w-lg mx-auto touch-pan-y"
            >
              {/* Drag handle */}
              <div
                onClick={onClose}
                className="w-12 h-1.5 bg-slate-300 hover:bg-slate-400 rounded-full mx-auto mb-4 cursor-pointer transition-colors"
                title="Drag or tap to dismiss"
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
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h4 className="font-extrabold text-sm text-[#0d1b3e] truncate">
                        {displayName}
                      </h4>
                      {isApprovedAmbassador && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[9px] font-black uppercase tracking-wider shrink-0 shadow-xs">
                          <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                          <span>Crew</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate font-medium">
                      {planConfig.name} plan · {userEmail}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onMouseEnter={() => import('../StudentProfileView').catch(() => {})}
                  onFocus={() => import('../StudentProfileView').catch(() => {})}
                  onClick={() => handleTileNavigation(() => onNavigateTab('profile'))}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors shrink-0 cursor-pointer shadow-xs"
                >
                  Profile
                </button>
              </div>

              {/* 4-column grid of rounded icon tiles (2 rows): stagger in (40ms each) */}
              <motion.div
                variants={{
                  hidden: {},
                  visible: {
                    transition: {
                      delayChildren: shouldReduceMotion ? 0 : 0.12,
                      staggerChildren: shouldReduceMotion ? 0 : 0.04,
                    },
                  },
                }}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-4 gap-2.5 mb-5"
              >
                {tiles.map((tile) => (
                  <motion.div
                    key={tile.id}
                    variants={{
                      hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 12 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: {
                          duration: shouldReduceMotion ? 0.05 : 0.28,
                          ease: [0.22, 1, 0.36, 1],
                        },
                      },
                    }}
                  >
                    <button
                      type="button"
                      onClick={tile.onClick}
                      className="w-full flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white hover:bg-indigo-50/70 border border-slate-100 hover:border-indigo-100 shadow-xs transition-all cursor-pointer min-h-[78px] text-center"
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
                  </motion.div>
                ))}
              </motion.div>

              {/* Below the grid actions */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                {/* Admin can NEVER apply or be a crew member -> hide crew row completely for admin */}
                {isAdmin ? null : isApprovedAmbassador ? (
                  /* 1. APPROVED AMBASSADOR: Crew Dashboard item with badge (First in list, Never show Apply) */
                  <button
                    type="button"
                    onClick={() => {
                      handleTileNavigation(() => {
                        if (onNavigateUrl) {
                          onNavigateUrl('/crew-dashboard');
                        } else if (typeof window !== 'undefined') {
                          window.history.pushState({}, '', '/crew-dashboard');
                          window.dispatchEvent(new PopStateEvent('popstate'));
                        }
                      });
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-indigo-50/90 to-violet-50/90 hover:from-indigo-100 hover:to-violet-100 border border-indigo-200/80 text-left transition-all cursor-pointer shadow-xs group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-[#0d1b3e]">
                            Crew Dashboard
                          </span>
                          <span className="px-1.5 py-0.5 rounded-md bg-indigo-600 text-white text-[9px] font-black uppercase tracking-wider">
                            Ambassador
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium">
                          Campus Ambassador portal, perks &amp; referrals
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-indigo-500" />
                  </button>
                ) : isRevoked ? (
                  /* 2. REVOKED USER: Button shows "Access revoked", cannot re-apply unless admin re-approves */
                  <div className="w-full flex items-center justify-between p-3 rounded-2xl bg-rose-50/80 border border-rose-200 text-left transition-colors cursor-not-allowed">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                        <XCircle className="w-4 h-4 text-rose-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-rose-900">
                            Access revoked
                          </span>
                          <span className="px-1.5 py-0.5 rounded-md bg-rose-200 text-rose-900 text-[9px] font-bold uppercase tracking-wider">
                            Revoked
                          </span>
                        </div>
                        <p className="text-[10px] text-rose-600">
                          Your Crew access was revoked. Contact administrator for re-approval.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : existingApp?.status === 'pending' ? (
                  /* 3. NON-AMBASSADOR WITH PENDING APPLICATION: "Application Under Review" */
                  <button
                    type="button"
                    onClick={() => {
                      setShowCrewModal(true);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-amber-50/80 hover:bg-amber-100 border border-amber-200 text-left transition-colors cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-amber-900">
                            Application Under Review
                          </span>
                          <span className="px-1.5 py-0.5 rounded-md bg-amber-200 text-amber-900 text-[9px] font-bold uppercase tracking-wider">
                            Pending
                          </span>
                        </div>
                        <p className="text-[10px] text-amber-700">
                          Boardly Crew application is being reviewed by our team
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-amber-500" />
                  </button>
                ) : (
                  /* 4. NON-AMBASSADOR WITH NO APPLICATION: Normal "Apply for Boardly Crew" */
                  <button
                    type="button"
                    onClick={() => {
                      setShowCrewModal(true);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Award className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[#0d1b3e]">
                            Apply for Boardly Crew
                          </span>
                          <span className="px-1.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-[9px] font-bold uppercase tracking-wider">
                            30d Premium
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Become a campus ambassador &amp; unlock free access
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                )}

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

          {/* Account Password Action */}
          <button
            type="button"
            onClick={() => {
              setShowPasswordModal(true);
            }}
            className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <Lock className="w-4 h-4 text-slate-600" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#0d1b3e] block">
                  {hasPasswordProvider ? 'Change Password' : 'Set Account Password'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {hasPasswordProvider ? 'Update your account password' : 'Add password for email sign-in'}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* Admin Dashboard (shsvirtualadmin@gmail.com only) */}
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
                  Admin Dashboard
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
        </motion.div>
      </>
    )}
  </AnimatePresence>

      {/* Crew Application & Review Modal */}
      {showCrewModal && (
        <CrewApplicationModal
          isOpen={showCrewModal}
          onClose={() => {
            setShowCrewModal(false);
            // Refresh app status after modal closes
            if (user?.uid) {
              fetchUserCrewApplication(user.uid).then((app) => {
                if (app) setExistingApp(app);
              }).catch(console.warn);
            }
          }}
        />
      )}

      {/* Set Password Modal */}
      {user && (
        <SetPasswordModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          user={user}
          mode={hasPasswordProvider ? 'change' : 'set'}
          onSuccess={() => {
            setPasswordSuccessFlag(true);
          }}
        />
      )}
    </>
  );
};

import React from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { X, Shield, Users, Flame, Trophy, Lock, Unlock, Check, Share2, Sparkles, AlertCircle } from 'lucide-react';
import { MatrixAvatar } from '@/lib/matrixAvatars';
import { AvatarFrame, AvatarPicture, Nameplate } from '@/components/koban/CosmeticRenderers';
import { ProBadge } from '@/components/ui/ProBadge';
import type { PublicCrewSummary, CrewDoc } from '@/types/crew';
import { fetchCrewDetails } from '@/services/crewService';

import { sanitizeStudentDisplayName } from '@/utils/privacy';
import { useProfileModal } from '@/contexts/ProfileModalContext';
import { useBodyScrollLock } from '@/utils/scrollLock';

interface CrewDetailsModalProps {
  summary: PublicCrewSummary;
  onClose: () => void;
  currentUser?: {
    uid: string;
    email?: string;
    streak?: number;
    score?: number;
    crewId?: string | null;
  } | null;
  onJoin?: (crew: PublicCrewSummary) => void;
  onRequest?: (crew: PublicCrewSummary) => void;
  isJoining?: boolean;
}

export const CrewDetailsModal: React.FC<CrewDetailsModalProps> = ({
  summary,
  onClose,
  currentUser,
  onJoin,
  onRequest,
  isJoining = false,
}) => {
  const [details, setDetails] = React.useState<CrewDoc | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [copiedLink, setCopiedLink] = React.useState(false);
  const { openProfile } = useProfileModal();

  useBodyScrollLock(true, 'crew-details-modal');

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isJoining) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isJoining, onClose]);

  React.useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        const data = await fetchCrewDetails(summary.id);
        if (active) setDetails(data);
      } catch (err) {
        console.warn('Failed to load crew details:', err);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [summary.id]);

  const inviteUrl = `https://boardly.cfd/join/${summary.code}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const isUserMember = currentUser && currentUser.crewId === summary.id;
  const isInOtherCrew = currentUser && currentUser.crewId && currentUser.crewId !== summary.id;
  const maxAllowed = Math.min(summary.maxMembers || 30, 30);
  const isCrewFull = summary.memberCount >= maxAllowed;
  const streakNeeded = summary.minStreak;
  const userStreak = currentUser?.streak || 0;
  const meetsStreak = userStreak >= streakNeeded;
  const cleanLeaderName = sanitizeStudentDisplayName(summary.leaderName);

  if (typeof document === 'undefined' || !document.body) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={summary.name}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isJoining) onClose();
      }}
      className="overlay-blur bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100dvh',
        zIndex: 1200,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0A0A0A] border border-[rgba(255,255,255,0.15)] rounded-t-2xl sm:rounded-2xl max-w-xl w-full text-white shadow-2xl relative flex flex-col overflow-hidden"
        style={{
          maxHeight: 'calc(100dvh - env(safe-area-inset-top, 0px) - 16px)',
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-lg text-[rgba(255,255,255,0.6)] hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close details"
        >
          <X size={20} />
        </button>

        {/* Scrollable Content */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6 space-y-6">
          {/* Header with Matrix Avatar */}
          <div className="flex items-start gap-4 pr-8">
            <MatrixAvatar
              avatarKey={summary.avatarKey}
              variant={summary.avatarVariant}
              size={72}
              className="ring-2 ring-[rgba(255,255,255,0.15)]"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold font-heading text-white">{summary.name}</h2>
                {summary.isPaidActive && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D71921]/20 border border-[#D71921] text-[#D71921] flex items-center gap-1">
                    <Sparkles size={10} /> Large Crew
                  </span>
                )}
              </div>
              <p className="text-xs text-[rgba(255,255,255,0.65)] font-mono">
                Code: <strong className="text-white uppercase tracking-wider">{summary.code}</strong> • Led by {cleanLeaderName}
              </p>
              {summary.bio ? (
                <p className="text-xs text-[rgba(255,255,255,0.8)] pt-1 leading-relaxed">{summary.bio}</p>
              ) : (
                <p className="text-xs text-[rgba(255,255,255,0.4)] italic pt-1">No bio provided yet.</p>
              )}
            </div>
          </div>

          {/* High-Level Stats */}
          <div className="grid grid-cols-4 gap-2 py-3 px-4 rounded-xl bg-[#141414] border border-[rgba(255,255,255,0.08)] text-center">
            <div>
              <div className="text-[11px] text-[rgba(255,255,255,0.6)] flex items-center justify-center gap-1">
                <Trophy size={11} className="text-[#D71921]" /> Rank
              </div>
              <div className="text-base font-bold font-heading text-white mt-0.5">#{summary.rank}</div>
            </div>
            <div>
              <div className="text-[11px] text-[rgba(255,255,255,0.6)] flex items-center justify-center gap-1">
                Score
              </div>
              <div className="text-base font-bold font-heading text-white mt-0.5">{summary.score}</div>
            </div>
            <div>
              <div className="text-[11px] text-[rgba(255,255,255,0.6)] flex items-center justify-center gap-1">
                <Users size={11} className="text-[#D71921]" /> Members
              </div>
              <div className="text-base font-bold font-heading text-white mt-0.5">
                {summary.memberCount}/{summary.maxMembers}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[rgba(255,255,255,0.6)] flex items-center justify-center gap-1">
                <Flame size={11} className="text-[#D71921]" /> Streak
              </div>
              <div className="text-base font-bold font-heading text-white mt-0.5">{summary.streak}d</div>
            </div>
          </div>

          {/* Join Conditions Panel */}
          <div className="p-3.5 rounded-xl bg-[#0F0F0F] border border-[rgba(255,255,255,0.1)] space-y-2">
            <div className="text-xs font-semibold text-[rgba(255,255,255,0.9)] flex items-center gap-1.5">
              <Shield size={14} className="text-[#D71921]" /> Entry Conditions
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-md bg-[#191919] border border-[rgba(255,255,255,0.1)] flex items-center gap-1.5">
                {summary.joinMode === 'direct' ? (
                  <>
                    <Unlock size={12} className="text-emerald-400" /> Direct Join (Instant)
                  </>
                ) : (
                  <>
                    <Lock size={12} className="text-amber-400" /> Request Approval Required
                  </>
                )}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-[#191919] border border-[rgba(255,255,255,0.1)]">
                {summary.minStreak > 0 ? `Min ${summary.minStreak}-day streak required` : 'No minimum streak'}
              </span>
              {summary.isClosed ? (
                <span className="px-2.5 py-1 rounded-md bg-red-950/40 border border-red-500/50 text-red-400">
                  Closed to new members
                </span>
              ) : isCrewFull ? (
                <span className="px-2.5 py-1 rounded-md bg-amber-950/40 border border-amber-500/50 text-amber-400">
                  Crew Full ({summary.memberCount}/{summary.maxMembers})
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-md bg-emerald-950/40 border border-emerald-500/50 text-emerald-400">
                  Open for new members
                </span>
              )}
            </div>
          </div>

          {/* Member Roster (Visible ONLY to verified crew members; non-members see privacy notice) */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-[rgba(255,255,255,0.9)] flex items-center justify-between">
              <span>Roster &amp; Member Activity</span>
              <span className="text-[11px] text-[rgba(255,255,255,0.5)]">
                {isUserMember ? 'Squad Member View' : 'Members Only'}
              </span>
            </div>

            {!isUserMember ? (
              <div className="p-4 rounded-xl bg-[#121212] border border-[rgba(255,255,255,0.08)] text-center text-xs text-[rgba(255,255,255,0.65)] space-y-1.5">
                <p className="font-semibold text-white flex items-center justify-center gap-1.5">
                  <Shield size={14} className="text-[#D71921]" /> Member List Private
                </p>
                <p className="text-[11px] text-[rgba(255,255,255,0.5)] max-w-sm mx-auto">
                  In accordance with Boardly Privacy Policies, individual member rosters are visible only to accepted squad members. Join this crew to collaborate and study together!
                </p>
              </div>
            ) : loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 rounded-lg bg-[#141414] animate-pulse" />
                ))}
              </div>
            ) : details?.members && details.members.length > 0 ? (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {details.members.map((m) => (
                  <div
                    key={m.uid}
                    onClick={() => {
                      onClose();
                      openProfile(m.uid);
                    }}
                    className="flex items-center justify-between p-2 rounded-lg bg-[#121212] border border-[rgba(255,255,255,0.06)] hover:border-red-600/50 cursor-pointer transition-colors"
                    title="View student profile"
                  >
                    <div className="flex items-center gap-2.5">
                      <AvatarFrame itemId={m.equipped?.frame || 'none'} size={34}>
                        <AvatarPicture
                          uid={m.uid}
                          seed={m.uid}
                          avatarId={m.equipped?.avatar}
                          size={26}
                        />
                      </AvatarFrame>
                      <div>
                        <div className="text-xs font-medium text-white flex items-center gap-1.5">
                          {m.equipped?.nameplate ? (
                            <Nameplate
                              itemId={m.equipped.nameplate}
                              name={sanitizeStudentDisplayName(m.displayName, m.uid)}
                              shortId={m.uid.slice(0, 5)}
                              roleBadge={m.role === 'leader' ? 'LEADER' : undefined}
                              forceStatic={true}
                            />
                          ) : (
                            <>
                              <span>{sanitizeStudentDisplayName(m.displayName, m.uid)}</span>
                              {(m as any).proBadge && (
                                <ProBadge design={(m as any).proBadge} size="sm" listMode />
                              )}
                              {m.role === 'leader' && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#D71921] text-white font-bold">
                                  LEADER
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[rgba(255,255,255,0.7)] font-mono">
                      <span className="flex items-center gap-1" title="Current streak">
                        <Flame size={12} className="text-[#D71921]" /> {m.streak || 0}d
                      </span>
                      <span className="text-[11px] text-[rgba(255,255,255,0.5)]">
                        {m.questionsSolved || 0} solved
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#141414] text-center text-xs text-[rgba(255,255,255,0.5)]">
                No member details found.
              </div>
            )}
          </div>
        </div>

        {/* Pinned Action Controls with safe-area-inset-bottom */}
        <div
          className="px-6 pt-3 flex items-center justify-between gap-3 border-t border-[rgba(255,255,255,0.1)] bg-[#0A0A0A] shrink-0"
          style={{
            paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
          }}
        >
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-3.5 py-2 rounded-xl bg-[#141414] hover:bg-[#1E1E1E] border border-[rgba(255,255,255,0.15)] text-xs text-white flex items-center gap-1.5 transition-colors"
          >
            {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} />}
            <span>{copiedLink ? 'Copied Link!' : 'Share Crew'}</span>
          </button>

          <div className="flex items-center gap-2">
            {!currentUser ? (
              <Link
                to={`/login?redirect=/join/${summary.code}`}
                className="px-5 py-2.5 rounded-xl bg-[#D71921] hover:bg-[#b0131a] text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
              >
                Sign In to Join
              </Link>
            ) : isUserMember ? (
              <Link
                to="/crew/my"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-[#D71921] hover:bg-[#b0131a] text-white text-xs font-bold transition-all flex items-center gap-1.5"
              >
                Go to My Crew
              </Link>
            ) : isInOtherCrew ? (
              <span className="text-xs text-[rgba(255,255,255,0.5)] italic px-2">
                Already in another crew
              </span>
            ) : summary.isClosed ? (
              <span className="text-xs text-red-400 px-2">Closed to new members</span>
            ) : isCrewFull ? (
              <span className="text-xs text-amber-400 px-2">Crew Full</span>
            ) : !meetsStreak ? (
              <span className="text-xs text-amber-400 px-2 flex items-center gap-1">
                <AlertCircle size={13} /> Needs {streakNeeded}-day streak (you have {userStreak})
              </span>
            ) : summary.joinMode === 'direct' ? (
              <button
                type="button"
                disabled={isJoining}
                onClick={() => onJoin && onJoin(summary)}
                className="px-5 py-2.5 rounded-xl bg-[#D71921] hover:bg-[#b0131a] text-white text-xs font-bold transition-all shadow-md disabled:opacity-50"
              >
                {isJoining ? 'Joining...' : 'Direct Join'}
              </button>
            ) : (
              <button
                type="button"
                disabled={isJoining}
                onClick={() => onRequest && onRequest(summary)}
                className="px-5 py-2.5 rounded-xl bg-[#D71921] hover:bg-[#b0131a] text-white text-xs font-bold transition-all shadow-md disabled:opacity-50"
              >
                {isJoining ? 'Sending...' : 'Request to Join'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};


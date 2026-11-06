import React, { useState } from 'react';
import { X, Copy, Check, Share2, Flame, Award, BookOpen } from 'lucide-react';
import { BannerRenderer } from '@/components/koban/artwork/bannerArtwork';
import { AvatarPicture, AvatarFrame } from '@/components/koban/CosmeticRenderers';
import { getRankTitle } from '@/config/rankLadder';
import type { PublicProfile } from '@/types';

interface ShareProfileCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PublicProfile;
}

export const ShareProfileCardModal: React.FC<ShareProfileCardModalProps> = ({
  isOpen,
  onClose,
  profile,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const rank = getRankTitle(profile.stats?.mcqs || profile.publicStats?.score, profile.stats?.streak);
  const accentColor = profile.accent || '#D71921';
  const streak = profile.stats?.streak ?? profile.publicStats?.streak ?? 0;
  const mcqs = profile.stats?.mcqs ?? profile.publicStats?.totalQuestionsSolved ?? 0;

  const handleCopyLink = () => {
    const url = `${window.location.origin}/dashboard/profile?uid=${profile.uid}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleNativeShare = () => {
    const url = `${window.location.origin}/dashboard/profile?uid=${profile.uid}`;
    if (navigator.share) {
      navigator.share({
        title: `${profile.displayName} on Boardly`,
        text: `Check out ${profile.displayName}'s student profile on Boardly Commons!`,
        url,
      }).catch(() => {});
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-[170] flex items-center justify-center p-4 overlay-blur bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-[var(--card)] border border-[var(--border)] overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <span className="font-heading font-bold text-sm text-[var(--text)]">Share Student Profile</span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--card-2)] border border-[var(--border)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Shareable Card Canvas Preview */}
        <div className="p-4 flex flex-col items-center">
          <div
            id="shareable-profile-card"
            className="w-full rounded-2xl overflow-hidden border border-[var(--border)] bg-neutral-950 shadow-xl flex flex-col relative"
          >
            {/* Banner */}
            <div className="relative h-28 w-full overflow-hidden">
              <BannerRenderer
                bannerId={profile.banner || profile.equipped?.banner}
                accentColor={accentColor}
                animated={false}
              />
            </div>

            {/* Profile Avatar & Info */}
            <div className="px-4 pb-4 -mt-8 flex flex-col gap-2.5 relative z-10">
              <div className="flex items-end justify-between">
                <div className="p-1 rounded-full bg-neutral-950">
                  <AvatarFrame itemId={profile.frame || profile.equipped?.frame || 'none'} size={60}>
                    <AvatarPicture
                      avatarId={profile.avatar}
                      avatarKey={profile.avatarKey}
                      variant={profile.avatarVariant}
                      size={52}
                    />
                  </AvatarFrame>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 border border-white/10 font-mono text-[11px] text-white">
                  <Flame size={13} className="text-orange-500 fill-orange-500" />
                  <span>{streak} day streak</span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-heading font-bold text-base text-white">
                    {profile.displayName}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="font-mono text-xs px-2 py-0.5 rounded-md font-semibold"
                    style={{ backgroundColor: rank.badgeBg, color: rank.badgeColor }}
                  >
                    {rank.title}
                  </span>
                  {profile.crewName && (
                    <span className="font-mono text-[11px] text-neutral-300">
                      Crew: {profile.crewName}
                    </span>
                  )}
                </div>
              </div>

              {/* Public Stats Summary Box */}
              <div className="grid grid-cols-2 gap-2 mt-1 p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-mono text-neutral-400">MCQs Solved</span>
                  <span className="text-sm font-mono font-bold text-white">{mcqs.toLocaleString()}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-mono text-neutral-400">Accuracy</span>
                  <span className="text-sm font-mono font-bold text-white">
                    {Math.round(profile.stats?.accuracy || profile.publicStats?.accuracy || 0)}%
                  </span>
                </div>
              </div>

              {/* Boardly Branding footer */}
              <div className="pt-2 flex items-center justify-between border-t border-white/10 text-[10px] font-mono text-neutral-400">
                <span className="font-heading font-bold text-[var(--red)] tracking-wider">BOARDLY</span>
                <span>boardly.cfd</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 pt-0 grid grid-cols-2 gap-2.5">
          <button
            onClick={handleCopyLink}
            className="h-11 rounded-xl border border-[var(--border)] text-xs font-heading font-semibold text-[var(--text)] hover:bg-[var(--card-2)] transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            {copied ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
            <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
          </button>

          <button
            onClick={handleNativeShare}
            className="h-11 rounded-xl bg-[var(--red)] hover:bg-[var(--red-dark)] text-white text-xs font-heading font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Share2 size={15} />
            <span>Share Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};

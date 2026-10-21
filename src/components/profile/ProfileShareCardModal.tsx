import React, { useRef, useState } from 'react';
import { X, Copy, Check, Download } from 'lucide-react';
import { BannerRenderer } from '@/components/koban/artwork/bannerArtwork';
import { AvatarFrame, AvatarPicture, Nameplate } from '@/components/koban/CosmeticRenderers';
import type { PublicProfile } from '@/types';

interface ProfileShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PublicProfile;
}

export const ProfileShareCardModal: React.FC<ProfileShareCardModalProps> = ({
  isOpen,
  onClose,
  profile,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/dashboard/profile?uid=${profile.uid}`;
    navigator.clipboard?.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current || isExporting) return;
    setIsExporting(true);
    try {
      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default || html2canvasModule;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0a0a0a',
        scale: 2,
        useCORS: true,
      });
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `boardly-profile-${profile.studentId || 'card'}.png`;
      a.click();
    } catch (err) {
      console.warn('[ProfileShareCardModal] Download error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm rounded-2xl border border-neutral-800 bg-[#0d0d0e] p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-neutral-100 font-mono">Share Profile Card</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* ── CARD TO SHARE (Banner, Avatar, Name, ID, Rank ONLY) ── */}
        <div
          ref={cardRef}
          className="relative rounded-2xl border border-neutral-800 bg-neutral-950 overflow-hidden shadow-lg"
        >
          {/* Banner */}
          <div className="w-full h-28 relative overflow-hidden">
            <BannerRenderer
              bannerId={profile.banner}
              accentColor={profile.accent}
              animated={false}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Profile details */}
          <div className="px-4 pb-5 pt-0">
            {/* Avatar overlapping banner */}
            <div className="-mt-9 mb-3 relative inline-block">
              <AvatarFrame
                itemId={profile.frame || 'none'}
                size={72}
                forceStatic
              >
                <AvatarPicture
                  itemId={profile.avatar || 'none'}
                  size={64}
                  photoURL={profile.photoURL}
                />
              </AvatarFrame>
            </div>

            {/* Name, Student ID, Rank ONLY */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Nameplate
                  itemId={profile.nameplate || 'none'}
                  name={profile.displayName}
                  forceStatic
                />
              </div>
              <div className="text-xs font-semibold text-neutral-400 font-mono">
                {profile.rankTitle || 'Fresher'}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-900 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
              <span>boardly.cfd</span>
              <span>Peer MCQ Network</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-1.5 min-h-[44px] px-3 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold text-neutral-200 transition-colors whitespace-nowrap"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy link'}</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadImage}
            disabled={isExporting}
            className="flex items-center justify-center gap-1.5 min-h-[44px] px-3 rounded-lg border border-red-800/60 bg-red-600 hover:bg-red-500 text-xs font-semibold text-white transition-colors whitespace-nowrap shadow-md shadow-red-950/40"
          >
            <Download size={14} />
            <span>{isExporting ? 'Exporting...' : 'Save card'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

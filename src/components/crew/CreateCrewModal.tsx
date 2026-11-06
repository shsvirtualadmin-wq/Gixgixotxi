import React, { useState } from 'react';
import { X, Sparkles, Users, Check, AlertCircle } from 'lucide-react';
import { AvatarPicker } from '@/lib/matrixAvatars';
import { type MatrixAvatarVariant } from '@/lib/matrixAvatarsData';
import type { CrewTier, CrewJoinMode } from '@/types/crew';
import { createNewCrew } from '@/services/crewService';

interface CreateCrewModalProps {
  onClose: () => void;
  onSuccess: (crewId: string) => void;
  creator: {
    uid: string;
    email: string;
    displayName: string;
    streak?: number;
  };
}

export const CreateCrewModal: React.FC<CreateCrewModalProps> = ({
  onClose,
  onSuccess,
  creator,
}) => {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarKey, setAvatarKey] = useState('skull-01');
  const [avatarVariant, setAvatarVariant] = useState<MatrixAvatarVariant>('red-on-black');
  const [joinMode, setJoinMode] = useState<CrewJoinMode>('direct');
  const [minStreak, setMinStreak] = useState<number>(0);
  const [tier, setTier] = useState<CrewTier>('free');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a squad name.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const created = await createNewCrew({
        name: name.trim(),
        bio: bio.trim(),
        avatarKey,
        avatarVariant,
        joinMode,
        minStreak: Number(minStreak) || 0,
        tier,
        creator,
      });
      onSuccess(created.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create crew.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overlay-blur bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0A0A0A] border border-[rgba(255,255,255,0.15)] rounded-2xl max-w-xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto text-white shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-heading text-white">Create Study Squad</h2>
            <p className="text-xs text-[rgba(255,255,255,0.65)]">
              Assemble your team, track collective streaks, and compete on the Pakistan leaderboard.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[rgba(255,255,255,0.6)] hover:text-white hover:bg-white/10"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-[#D71921] text-[#D71921] text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name & Bio */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[rgba(255,255,255,0.85)] mb-1">
                Crew Name *
              </label>
              <input
                type="text"
                required
                maxLength={50}
                placeholder="e.g. FAST Titans, NET Vanguard, GIKI Orbit"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#141414] border border-[rgba(255,255,255,0.12)] text-sm text-white placeholder-[rgba(255,255,255,0.3)] focus:outline-none focus:border-[#D71921]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[rgba(255,255,255,0.85)]">
                  Bio (Max 160 characters)
                </label>
                <span className="text-[11px] text-[rgba(255,255,255,0.4)]">
                  {bio.length}/160
                </span>
              </div>
              <textarea
                maxLength={160}
                rows={2}
                placeholder="Brief squad description, universities, or study motto..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#141414] border border-[rgba(255,255,255,0.12)] text-sm text-white placeholder-[rgba(255,255,255,0.3)] focus:outline-none focus:border-[#D71921] resize-none"
              />
            </div>
          </div>

          {/* Logo Picker */}
          <div className="p-3.5 rounded-xl bg-[#0F0F0F] border border-[rgba(255,255,255,0.08)]">
            <AvatarPicker
              title="Pick Squad Dot-Matrix Logo"
              selectedKey={avatarKey}
              selectedVariant={avatarVariant}
              onSelect={(key, variant) => {
                setAvatarKey(key);
                setAvatarVariant(variant);
              }}
            />
          </div>

          {/* Join Conditions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[rgba(255,255,255,0.85)] mb-1">
                Join Mode
              </label>
              <select
                value={joinMode}
                onChange={(e) => setJoinMode(e.target.value as CrewJoinMode)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#141414] border border-[rgba(255,255,255,0.12)] text-xs text-white focus:outline-none focus:border-[#D71921]"
              >
                <option value="direct">Direct Join (Instant entry)</option>
                <option value="request">Request Approval (Admin review)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[rgba(255,255,255,0.85)] mb-1">
                Minimum Streak Required
              </label>
              <select
                value={minStreak}
                onChange={(e) => setMinStreak(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-[#141414] border border-[rgba(255,255,255,0.12)] text-xs text-white focus:outline-none focus:border-[#D71921]"
              >
                <option value={0}>0 days (Anyone can join)</option>
                <option value={3}>3-day study streak</option>
                <option value={7}>7-day study streak</option>
                <option value={14}>14-day study streak</option>
                <option value={30}>30-day master streak</option>
              </select>
            </div>
          </div>

          {/* Size Tier Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[rgba(255,255,255,0.85)]">
              Squad Size &amp; Billing Tier
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Free Tier */}
              <button
                type="button"
                onClick={() => setTier('free')}
                className={`p-3.5 rounded-xl text-left border transition-all flex flex-col justify-between gap-2 ${
                  tier === 'free'
                    ? 'bg-[#181818] border-white ring-1 ring-white'
                    : 'bg-[#101010] border-[rgba(255,255,255,0.08)] hover:bg-[#141414]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-bold text-sm text-white">Free Crew</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/10 text-white">
                      PKR 0
                    </span>
                  </div>
                  <p className="text-[11px] text-[rgba(255,255,255,0.6)] mt-1">
                    Up to 5 squad members (including leader). Ideal for close study partners.
                  </p>
                </div>
                <div className="text-[10px] text-[rgba(255,255,255,0.7)] flex items-center gap-1">
                  <Check size={12} className="text-emerald-400" /> Free forever, no card required
                </div>
              </button>

              {/* Large Tier */}
              <button
                type="button"
                onClick={() => setTier('paid')}
                className={`p-3.5 rounded-xl text-left border transition-all flex flex-col justify-between gap-2 ${
                  tier === 'paid'
                    ? 'bg-[#201011] border-[#D71921] ring-1 ring-[#D71921]'
                    : 'bg-[#101010] border-[rgba(255,255,255,0.08)] hover:bg-[#141414]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-bold text-sm text-white flex items-center gap-1.5">
                      <Sparkles size={13} className="text-[#D71921]" /> Large Crew
                    </span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#D71921] text-white font-bold">
                      PKR 499 / mo
                    </span>
                  </div>
                  <p className="text-[11px] text-[rgba(255,255,255,0.6)] mt-1">
                    More than 5 members (up to 30) + <strong>Pro sharing</strong> for all squad members!
                  </p>
                </div>
                <div className="text-[10px] text-[rgba(255,255,255,0.7)] flex items-center gap-1">
                  <Check size={12} className="text-[#D71921]" /> Includes shared Pro for all members
                </div>
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[rgba(255,255,255,0.1)]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs text-[rgba(255,255,255,0.7)] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-6 py-2.5 rounded-xl bg-[#D71921] hover:bg-[#b0131a] text-white text-xs font-bold transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                'Creating Crew...'
              ) : (
                <>
                  <Users size={14} />
                  <span>Create Squad</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

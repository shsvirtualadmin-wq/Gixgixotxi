import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles, ShoppingBag, History, Coins, ArrowRight } from 'lucide-react';
import { KobanIcon } from '@/components/koban/KobanIcon';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  balance,
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 overlay-blur bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Koban Wallet"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-[32px] glass-panel p-5 sm:p-6 flex flex-col gap-5 animate-in zoom-in-95 duration-150"
      >
        {/* Header with Close */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#E8A317]/15 border border-[#E8A317]/30 flex items-center justify-center text-[#D97706] dark:text-[#FBBF24]">
              <Coins size={16} />
            </div>
            <div>
              <h3 className="font-dot font-bold text-sm sm:text-base text-[var(--text)]">
                Koban Wallet
              </h3>
              <p className="text-[11px] text-[var(--muted)]">
                Boardly digital currency & cosmetics
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full glass-pill text-[var(--muted)] hover:text-[var(--text)] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Balance Card */}
        <div className="p-4 rounded-[22px] glass-row bg-gradient-to-br from-[#E8A317]/10 via-transparent to-transparent border border-[#E8A317]/30 flex flex-col items-center justify-center text-center gap-1.5 py-6">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] font-bold">
            Available Balance
          </span>
          <div className="flex items-center gap-2.5 my-1">
            <KobanIcon size={28} />
            <span className="font-dot font-black text-3xl sm:text-4xl text-[#D97706] dark:text-[#FBBF24] tracking-tight">
              {balance.toLocaleString()}
            </span>
          </div>
          <span className="text-xs text-[var(--muted)] font-medium">
            Kobans in your student vault
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate('/store');
            }}
            className="btn-primary h-11 px-4 rounded-full text-xs font-heading font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShoppingBag size={14} />
            <span>Get Kobans</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              navigate('/dashboard/plans');
            }}
            className="btn-secondary h-11 px-4 rounded-full text-xs font-heading font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <History size={14} />
            <span>Ledger History</span>
          </button>
        </div>

        {/* How to Earn Kobans info */}
        <div className="p-3.5 rounded-[18px] glass-row flex flex-col gap-1.5 text-xs">
          <span className="font-heading font-semibold text-[11px] text-[var(--text)] flex items-center gap-1.5">
            <Sparkles size={12} className="text-[#E8A317]" />
            How to Earn Kobans
          </span>
          <p className="text-[11px] text-[var(--muted)] leading-relaxed">
            Maintain daily study streaks, complete practice sprints, and share verified notes on Boardly Commons.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WalletModal;

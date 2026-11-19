import React, { useMemo, useState } from 'react';
import { Crown, PenSquare, Search, Sparkles, X } from 'lucide-react';
import {
  AI_MENTORS,
  getMentorConfig,
  type AiMentorId,
} from '@/utils/aiMentorsLogic';
import type { SavedAiChat } from '@/services/aiMentorsService';

interface AiHistorySidebarProps {
  chats: SavedAiChat[];
  activeChatId: string | null;
  activeMentor: AiMentorId;
  isPro: boolean;
  isSuperAdmin: boolean;
  planSource: 'superadmin' | 'personal' | 'crew' | 'none';
  onSelectMentor: (mentorId: AiMentorId) => void;
  onSelectChat: (chat: SavedAiChat) => void;
  onDeleteChat: (chatId: string) => void;
  onNewChat: () => void;
  onUpgradeClick: () => void;
  onCloseMobileDrawer?: () => void;
}

export const AiHistorySidebar: React.FC<AiHistorySidebarProps> = ({
  chats,
  activeChatId,
  activeMentor,
  isPro,
  isSuperAdmin,
  planSource,
  onSelectMentor,
  onSelectChat,
  onDeleteChat,
  onNewChat,
  onUpgradeClick,
  onCloseMobileDrawer,
}) => {
  const [search, setSearch] = useState('');

  const filteredChats = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sorted = [...chats].sort((a, b) => b.updatedAt - a.updatedAt);
    if (!q) return sorted;
    return sorted.filter((c) => {
      const mentor = getMentorConfig(c.mentor);
      return (
        c.title.toLowerCase().includes(q) ||
        mentor.name.toLowerCase().includes(q) ||
        mentor.role.toLowerCase().includes(q)
      );
    });
  }, [chats, search]);

  const planBadgeLabel = isSuperAdmin
    ? 'Superadmin · Unlimited'
    : planSource === 'crew'
    ? 'Crew Pro · 100/day'
    : isPro
    ? 'Boardly Pro · 100/day'
    : 'Free Plan · 5/day';

  return (
    <div
      className="flex h-full flex-col min-h-0"
      style={{
        backgroundColor: 'var(--bg)',
        color: 'var(--text)',
      }}
    >
      {/* Top header + New Chat red pill button */}
      <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="h-4 w-4 shrink-0" style={{ color: 'var(--accent)' }} />
          <span
            className="text-[16px] font-bold truncate"
            style={{ fontFamily: "'Doto', var(--font-dot), sans-serif", color: 'var(--text)' }}
          >
            Boardly AI
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              onNewChat();
              onCloseMobileDrawer?.();
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold text-white cursor-pointer transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <PenSquare className="h-3.5 w-3.5" />
            <span>Chat</span>
          </button>

          {onCloseMobileDrawer && (
            <button
              type="button"
              onClick={onCloseMobileDrawer}
              aria-label="Close history"
              className="ai-header-icon-btn flex h-9 w-9 items-center justify-center rounded-full cursor-pointer lg:hidden"
              style={{ color: 'var(--text)' }}
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Search pill */}
      <div className="px-3.5 pb-3 shrink-0">
        <div
          className="flex h-10 items-center gap-2 rounded-full px-3.5 transition-shadow focus-within:ring-2 focus-within:ring-[var(--accent)]"
          style={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
          }}
        >
          <Search className="h-4 w-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats or mentor"
            aria-label="Search AI chats"
            className="ai-search-input w-full min-w-0 bg-transparent text-[13.5px] outline-none border-0 shadow-none appearance-none placeholder:text-[var(--placeholder)]"
            style={{ color: 'var(--text)' }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Mentors + Chats list */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 pb-3 space-y-4">
        {/* 5 Mentors Quick Switch */}
        <div>
          <div
            className="px-2 pb-1.5 text-[12px] font-medium"
            style={{ color: 'var(--text-muted)' }}
          >
            Mentors
          </div>
          <div className="space-y-1">
            {AI_MENTORS.map((m) => {
              const isCurrent = m.id === activeMentor;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    onSelectMentor(m.id);
                    onCloseMobileDrawer?.();
                  }}
                  className="w-full flex items-center gap-2.5 rounded-2xl px-2.5 py-2 text-left transition-colors cursor-pointer"
                  style={{
                    backgroundColor: isCurrent
                      ? `color-mix(in srgb, ${m.accent} 12%, var(--card))`
                      : 'transparent',
                    border: isCurrent
                      ? `1px solid color-mix(in srgb, ${m.accent} 40%, transparent)`
                      : '1px solid transparent',
                  }}
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
                    style={{ backgroundColor: m.accent }}
                  >
                    {m.name[0]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-semibold truncate" style={{ color: 'var(--text)' }}>
                      {m.name}
                    </div>
                    <div className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                      {m.role}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Saved Chats */}
        <div>
          <div
            className="px-2 pb-1.5 text-[12px] font-medium flex items-center justify-between"
            style={{ color: 'var(--text-muted)' }}
          >
            <span>Chats</span>
            {filteredChats.length > 0 && (
              <span className="tabular-nums text-[11px]">{filteredChats.length}</span>
            )}
          </div>

          {filteredChats.length === 0 ? (
            <div
              className="rounded-2xl px-3 py-4 text-center text-[12.5px]"
              style={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
              }}
            >
              {search.trim() ? 'No matching chats' : 'Your saved mentor chats will appear here.'}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredChats.map((chat) => {
                const mentor = getMentorConfig(chat.mentor);
                const isSelected = chat.id === activeChatId;
                return (
                  <div
                    key={chat.id}
                    className="group flex items-center gap-1 rounded-2xl px-2 py-1.5 transition-colors"
                    style={{
                      backgroundColor: isSelected ? 'var(--card)' : 'transparent',
                      border: isSelected ? '1px solid var(--border)' : '1px solid transparent',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onSelectChat(chat);
                        onCloseMobileDrawer?.();
                      }}
                      className="flex min-w-0 flex-1 items-center gap-2 py-1 text-left cursor-pointer"
                    >
                      <span className="shrink-0 text-[13px]" aria-hidden="true">
                        {mentor.emoji}
                      </span>
                      <span
                        className="min-w-0 flex-1 truncate text-[13px] font-medium"
                        style={{ color: 'var(--text)' }}
                      >
                        {chat.title}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChat(chat.id);
                      }}
                      aria-label={`Delete chat ${chat.title}`}
                      title="Delete chat"
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full opacity-75 hover:opacity-100 hover:bg-[var(--surface-hover)] cursor-pointer transition-opacity"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Plan Badge */}
      <div
        className="shrink-0 px-3.5 py-3 pb-[calc(12px+env(safe-area-inset-bottom,0px))] lg:pb-3"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <div
          className="flex items-center justify-between gap-2 rounded-full px-3.5 py-2"
          style={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Crown
              className="h-4 w-4 shrink-0"
              style={{ color: isPro ? 'var(--accent)' : 'var(--text-muted)' }}
            />
            <span className="text-[12.5px] font-semibold truncate" style={{ color: 'var(--text)' }}>
              {planBadgeLabel}
            </span>
          </div>
          {!isPro && (
            <button
              type="button"
              onClick={onUpgradeClick}
              className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white cursor-pointer"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              Upgrade
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

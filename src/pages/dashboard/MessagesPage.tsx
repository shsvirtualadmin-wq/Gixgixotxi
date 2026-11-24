import React, { useMemo } from 'react';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageMeta } from '@/components/ui/PageMeta';
import { SUPER_ADMIN_UID, SUPER_ADMIN_NAME } from '@/constants/superAdmin';
import {
  MessagesDashboardContent,
  type TargetChatUser,
} from '@/components/chat/DirectMessageModal';

export function MessagesPage() {
  const { t } = useLanguage();
  const { user, isGuest } = useAuth();
  const [searchParams] = useSearchParams();
  const params = useParams<{ conversationId?: string }>();
  const location = useLocation();
  const routeState = (location.state || {}) as { partner?: TargetChatUser };

  const initialTab = useMemo<'chat' | 'requests'>(() => {
    const tab = searchParams.get('tab') || searchParams.get('chat');
    if (tab === 'requests' || searchParams.get('requestId')) {
      return 'requests';
    }
    return 'chat';
  }, [searchParams]);

  const initialConversationId = useMemo<string | null>(() => {
    return params.conversationId || searchParams.get('conversationId') || null;
  }, [params.conversationId, searchParams]);

  const initialRequestId = useMemo<string | null>(() => {
    return searchParams.get('requestId') || null;
  }, [searchParams]);

  const initialPartner = useMemo<TargetChatUser | null>(() => {
    if (initialTab === 'requests') return null;

    if (routeState?.partner?.uid && routeState.partner.uid !== user?.uid) {
      return routeState.partner;
    }

    let uid = searchParams.get('uid') || searchParams.get('user') || '';
    const convId =
      params.conversationId || searchParams.get('conversationId') || '';

    if (!uid && convId.startsWith('conv_') && user?.uid) {
      const parts = convId.slice('conv_'.length).split('_');
      if (parts.length === 2) {
        uid =
          parts[0] === user.uid
            ? parts[1]
            : parts[1] === user.uid
            ? parts[0]
            : '';
      }
    }

    if (!uid || uid === user?.uid) return null;
    const defaultName = uid === SUPER_ADMIN_UID ? SUPER_ADMIN_NAME : t('common.student');
    const name = searchParams.get('name') || defaultName;
    return {
      uid,
      displayName: name,
      role: uid === SUPER_ADMIN_UID ? 'admin' : undefined,
    };
  }, [
    searchParams,
    params.conversationId,
    user?.uid,
    initialTab,
    routeState?.partner,
    t,
  ]);

  if (isGuest || (user?.uid && user.uid.startsWith('guest_'))) {
    return (
      <div data-student-page="messages" className="min-h-screen bg-[var(--bg)] text-[var(--text)] px-4 pt-6 pb-24 max-w-2xl mx-auto space-y-5">
        <PageMeta
          title={`${t('chat.title')} — Boardly`}
          description={t('chat.subtitle')}
          noindex={true}
        />
        <header>
          <h1 className="font-doto-title text-2xl tracking-[0.08em] text-[var(--text)] uppercase">
            {t('chat.title')}
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            {t('chat.subtitle')}
          </p>
        </header>
        <div className="boardly-glass-card rounded-[28px] p-8 text-center space-y-2.5">
          <div className="w-12 h-12 rounded-full bg-white/10 border border-white/15 flex items-center justify-center mx-auto text-[var(--text)]">
            <MessageCircle className="w-5 h-5" />
          </div>
          <p className="text-[15px] font-bold text-[var(--text)]">
            {t('chat.guestTitle')}
          </p>
          <p className="text-[13px] text-[var(--muted)] max-w-xs mx-auto leading-relaxed">
            {t('chat.guestDesc')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title={`${t('chat.title')} — Boardly`}
        description={t('chat.subtitle')}
        noindex={true}
      />
      <MessagesDashboardContent
        initialTab={initialTab}
        initialPartner={initialPartner}
        initialConversationId={initialConversationId}
        initialRequestId={initialRequestId}
      />
    </>
  );
}

export default MessagesPage;

import React, { useMemo } from 'react';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PageMeta } from '@/components/ui/PageMeta';
import { SUPER_ADMIN_UID, SUPER_ADMIN_NAME } from '@/constants/superAdmin';
import {
  MessagesDashboardContent,
  type TargetChatUser,
} from '@/components/chat/DirectMessageModal';

export function MessagesPage() {
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
    const defaultName = uid === SUPER_ADMIN_UID ? SUPER_ADMIN_NAME : 'Student';
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
  ]);

  if (isGuest || (user?.uid && user.uid.startsWith('guest_'))) {
    return (
      <div data-student-page="messages" className="min-h-screen bg-[#050506] text-white px-4 pt-6 pb-24 max-w-2xl mx-auto space-y-5">
        <PageMeta
          title="Messages — Boardly"
          description="Direct conversations and chat requests with fellow students."
          noindex={true}
        />
        <header>
          <h1 className="font-doto-title text-2xl tracking-[0.08em] text-white">
            MESSAGES
          </h1>
          <p className="text-sm text-white/70 mt-1">
            Direct conversations and chat requests with fellow students.
          </p>
        </header>
        <div className="boardly-glass-card rounded-[28px] p-8 text-center space-y-2.5">
          <div className="w-12 h-12 rounded-full bg-white/10 border border-white/15 flex items-center justify-center mx-auto text-white/75">
            <MessageCircle className="w-5 h-5" />
          </div>
          <p className="text-[15px] font-bold text-white">
            Sign in with a full account to chat
          </p>
          <p className="text-[13px] text-white/70 max-w-xs mx-auto leading-relaxed">
            Upgrade your guest session to send chat requests and message fellow
            students directly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Messages — Boardly"
        description="Direct conversations and chat requests with fellow students."
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

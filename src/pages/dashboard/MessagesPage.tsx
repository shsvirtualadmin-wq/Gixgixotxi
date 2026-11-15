import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
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

  const initialTab = useMemo<'chat' | 'requests'>(() => {
    const tab = searchParams.get('tab') || searchParams.get('chat');
    if (tab === 'requests' || searchParams.get('requestId')) {
      return 'requests';
    }
    return 'chat';
  }, [searchParams]);

  const initialConversationId = useMemo<string | null>(() => {
    return searchParams.get('conversationId') || null;
  }, [searchParams]);

  const initialRequestId = useMemo<string | null>(() => {
    return searchParams.get('requestId') || null;
  }, [searchParams]);

  const initialPartner = useMemo<TargetChatUser | null>(() => {
    // If explicitly opening the Requests tab, show the Requests list so user can accept/decline
    if (initialTab === 'requests') return null;

    let uid = searchParams.get('uid') || searchParams.get('user') || '';
    const convId = searchParams.get('conversationId') || '';

    if (!uid && convId.startsWith('conv_') && user?.uid) {
      const parts = convId.slice('conv_'.length).split('_');
      if (parts.length === 2) {
        uid = parts[0] === user.uid ? parts[1] : parts[1] === user.uid ? parts[0] : '';
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
  }, [searchParams, user?.uid, initialTab]);

  if (isGuest || (user?.uid && user.uid.startsWith('guest_'))) {
    return (
      <div className="msg-page space-y-5">
        <PageMeta
          title="Messages — Boardly"
          description="Direct conversations and chat requests with fellow students."
          noindex={true}
        />
        <header className="pt-1">
          <h1 className="msg-title">Messages</h1>
          <p className="msg-desc">
            Direct conversations and chat requests with fellow students.
          </p>
        </header>
        <div className="msg-empty-box">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mb-1"
            style={{
              backgroundColor: 'var(--rs-card2)',
              boxShadow: 'inset 0 0 0 1px var(--rs-line)',
              color: 'var(--rs-muted)',
            }}
          >
            <MessageCircle size={20} />
          </div>
          <p
            className="text-[15px] font-bold m-0"
            style={{ color: 'var(--rs-text)' }}
          >
            Sign in with a full account to chat
          </p>
          <p
            className="text-[13px] max-w-xs m-0 leading-relaxed"
            style={{ color: 'var(--rs-muted)' }}
          >
            Upgrade your guest session to send chat requests and message fellow students directly.
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


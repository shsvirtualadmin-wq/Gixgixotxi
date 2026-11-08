import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PageMeta } from '@/components/ui/PageMeta';
import {
  MessagesDashboardContent,
  type TargetChatUser,
} from '@/components/chat/DirectMessageModal';

export function MessagesPage() {
  const { user, isGuest } = useAuth();
  const [searchParams] = useSearchParams();

  const initialTab = useMemo<'chat' | 'requests'>(() => {
    const tab = searchParams.get('tab') || searchParams.get('chat');
    return tab === 'requests' ? 'requests' : 'chat';
  }, [searchParams]);

  const initialPartner = useMemo<TargetChatUser | null>(() => {
    const uid = searchParams.get('uid') || searchParams.get('user');
    if (!uid || uid === user?.uid) return null;
    const name = searchParams.get('name') || 'Student';
    return {
      uid,
      displayName: name,
    };
  }, [searchParams, user?.uid]);

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
      />
    </>
  );
}

export default MessagesPage;

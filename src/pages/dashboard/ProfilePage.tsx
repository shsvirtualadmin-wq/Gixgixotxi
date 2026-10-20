import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ProfileView } from '@/components/profile/ProfileView';
import { useProfileModal } from '@/contexts/ProfileModalContext';

export function ProfilePage() {
  const [searchParams] = useSearchParams();
  const queryUid = searchParams.get('uid');
  const { user } = useAuth();
  const { openProfile } = useProfileModal();

  const targetUid = queryUid || user?.uid || null;
  const isOwn = !queryUid || (user && queryUid === user.uid);

  return (
    <div className="w-full flex justify-center py-0 sm:py-4 px-0 sm:px-2 md:px-4">
      <div className="w-full max-w-[960px]">
        <ProfileView
          targetUid={targetUid}
          mode={isOwn ? 'own' : 'public'}
          isEmbedded={true}
          onOpenUserProfile={openProfile}
        />
      </div>
    </div>
  );
}

export default ProfilePage;

import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProfileView } from '@/components/profile/ProfileView';

export function ProfilePage() {
  const [searchParams] = useSearchParams();
  const targetUid = searchParams.get('uid');

  return (
    <div className="w-full flex justify-center py-2 sm:py-6">
      <ProfileView
        targetUid={targetUid}
        isFullPage={true}
      />
    </div>
  );
}

export default ProfilePage;

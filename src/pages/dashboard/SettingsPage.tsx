import React from 'react';
import { useParams } from 'react-router-dom';
import { PageMeta } from '@/components/ui/PageMeta';
import { BoardlySettingsFlow } from '@/components/settings/BoardlySettingsFlow';

export const SettingsPage: React.FC = () => {
  const { subPage } = useParams<{ subPage?: string }>();

  return (
    <>
      <PageMeta
        title="Settings — Boardly"
        description="Manage your Boardly account, customization, security, sessions, passkeys, and privacy settings."
        canonicalPath={subPage ? `/settings/${subPage}` : '/settings'}
      />
      <BoardlySettingsFlow initialSubPage={subPage} scrollContainer="window" />
    </>
  );
};

export default SettingsPage;

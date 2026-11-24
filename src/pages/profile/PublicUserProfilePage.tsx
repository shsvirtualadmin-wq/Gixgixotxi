import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PageMeta } from '@/components/ui/PageMeta';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ContentUnavailableScreen } from '@/components/ui/ContentUnavailableScreen';
import { LineLoader } from '@/components/ui/LineLoader';
import { ProfileView } from '@/components/profile/ProfileView';
import { resolveProfileByUsernameOrUid } from '@/services/publicProfileService';
import { useLanguage } from '@/contexts/LanguageContext';

export const PublicUserProfilePage: React.FC = () => {
  const { username: rawUsername, userId: rawUserId } = useParams<{
    username?: string;
    userId?: string;
  }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const rawParam = (rawUsername || rawUserId || '').trim();

  const [targetUid, setTargetUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function resolveUid() {
      if (!rawParam) {
        if (mounted) {
          setNotFound(true);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setNotFound(false);

      try {
        const uid = rawParam.replace(/^@/, '');

        // 0. Check D1 username & 14-day username_history table first
        const d1Resolved = await resolveProfileByUsernameOrUid(uid).catch(() => null);
        if (d1Resolved?.profile?.uid) {
          if (
            d1Resolved.redirectedFromOldUsername &&
            d1Resolved.currentUsername &&
            d1Resolved.currentUsername.toLowerCase() !== uid.toLowerCase()
          ) {
            navigate(`/u/${encodeURIComponent(d1Resolved.currentUsername)}`, { replace: true });
          }
          if (mounted) {
            setTargetUid(d1Resolved.profile.uid);
            setLoading(false);
          }
          return;
        }

        // 1. Check if rawParam exists directly in users/{uid}
        const directUserSnap = await getDoc(doc(db, 'users', uid)).catch(() => null);
        if (directUserSnap && directUserSnap.exists()) {
          if (mounted) {
            setTargetUid(uid);
            setLoading(false);
          }
          return;
        }

        // 2. Check usernames/{usernameLower}
        const unameSnap = await getDoc(doc(db, 'usernames', uid.toLowerCase())).catch(() => null);
        if (unameSnap && unameSnap.exists() && unameSnap.data()?.uid) {
          if (mounted) {
            setTargetUid(unameSnap.data().uid);
            setLoading(false);
          }
          return;
        }

        // 3. Check publicProfiles/{uid}
        const pubSnap = await getDoc(doc(db, 'publicProfiles', uid)).catch(() => null);
        if (pubSnap && pubSnap.exists()) {
          if (mounted) {
            setTargetUid(uid);
            setLoading(false);
          }
          return;
        }

        // 4. Query publicProfiles where usernameLower == rawParam (case-insensitive fallback)
        const q = query(
          collection(db, 'publicProfiles'),
          where('usernameLower', '==', uid.toLowerCase()),
          limit(1)
        );
        const querySnap = await getDocs(q).catch(() => null);
        if (querySnap && !querySnap.empty) {
          if (mounted) {
            setTargetUid(querySnap.docs[0].id);
            setLoading(false);
          }
          return;
        }

        // 5. Not found in any profile table
        if (mounted) {
          setNotFound(true);
          setLoading(false);
        }
      } catch (err) {
        console.warn('[PublicUserProfilePage] resolveUid warning:', err);
        if (mounted) {
          setNotFound(true);
          setLoading(false);
        }
      }
    }

    void resolveUid();

    return () => {
      mounted = false;
    };
  }, [rawParam, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pt-28 pb-24 px-4 flex items-center justify-center">
        <LineLoader context="generic" variant="section" />
      </div>
    );
  }

  if (notFound || !targetUid) {
    return (
      <ContentUnavailableScreen
        title={t('profile.unavailableTitle')}
        message={t('profile.unavailableDesc')}
        badge={t('profile.unavailableBadge')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pt-24 pb-24 px-2 sm:px-6">
      <PageMeta
        title={`${t('profile.studentProfile')} — Boardly`}
        description={t('profile.publicMetaDesc')}
        canonicalPath={`/u/${encodeURIComponent(rawParam)}`}
        ogType="profile"
      />

      <div className="max-w-4xl mx-auto mb-3 px-2 sm:px-0">
        <Breadcrumbs
          items={[
            { label: t('nav.commons'), href: '/commons' },
            { label: t('profile.studentProfile') },
          ]}
        />
      </div>

      <ProfileView targetUid={targetUid} isFullPage={true} />
    </div>
  );
};

export default PublicUserProfilePage;

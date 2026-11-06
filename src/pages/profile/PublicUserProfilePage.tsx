import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PageMeta } from '@/components/ui/PageMeta';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ContentUnavailableScreen } from '@/components/ui/ContentUnavailableScreen';
import { LineLoader } from '@/components/ui/LineLoader';
import { ProfileView } from '@/components/profile/ProfileView';
import { buildProfileSharePreview, humanizeSlugWithoutIds } from '@/utils/sharePreviewHelper';

export const PublicUserProfilePage: React.FC = () => {
  const { username: rawUsername, userId: rawUserId } = useParams<{
    username?: string;
    userId?: string;
  }>();
  const rawParam = (rawUsername || rawUserId || '').trim();

  const [targetUid, setTargetUid] = useState<string | null>(null);
  const [profileMeta, setProfileMeta] = useState<{
    displayName?: string | null;
    username?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
    role?: string | null;
    followersCount?: number | null;
    postsCount?: number | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let mounted = true;

    const extractMeta = (data: Record<string, any> | undefined, fallbackHandle?: string) => {
      if (!data) return null;
      return {
        displayName: data.displayName || data.name || null,
        username: data.username || fallbackHandle || null,
        bio: data.bio || null,
        avatarUrl: data.photoURL || data.avatarUrl || null,
        role: data.role || null,
        followersCount: typeof data.followersCount === 'number' ? data.followersCount : null,
        postsCount: typeof data.postsCount === 'number' ? data.postsCount : null,
      };
    };

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
        const uid = rawParam;

        // 1. Check if rawParam exists directly in users/{uid}
        const directUserSnap = await getDoc(doc(db, 'users', uid)).catch(() => null);
        if (directUserSnap && directUserSnap.exists()) {
          if (mounted) {
            setTargetUid(uid);
            setProfileMeta(extractMeta(directUserSnap.data()));
            setLoading(false);
          }
          return;
        }

        // 2. Check usernames/{usernameLower}
        const unameSnap = await getDoc(doc(db, 'usernames', uid.toLowerCase())).catch(() => null);
        if (unameSnap && unameSnap.exists() && unameSnap.data()?.uid) {
          const resolvedUid = unameSnap.data().uid;
          const pubForUname = await getDoc(doc(db, 'publicProfiles', resolvedUid)).catch(() => null);
          if (mounted) {
            setTargetUid(resolvedUid);
            setProfileMeta(
              extractMeta(pubForUname?.exists() ? pubForUname.data() : unameSnap.data(), uid)
            );
            setLoading(false);
          }
          return;
        }

        // 3. Check publicProfiles/{uid}
        const pubSnap = await getDoc(doc(db, 'publicProfiles', uid)).catch(() => null);
        if (pubSnap && pubSnap.exists()) {
          if (mounted) {
            setTargetUid(uid);
            setProfileMeta(extractMeta(pubSnap.data()));
            setLoading(false);
          }
          return;
        }

        // 4. Query publicProfiles where username == rawParam (case-insensitive fallback)
        const q = query(
          collection(db, 'publicProfiles'),
          where('username', '==', uid.toLowerCase()),
          limit(1)
        );
        const querySnap = await getDocs(q).catch(() => null);
        if (querySnap && !querySnap.empty) {
          if (mounted) {
            setTargetUid(querySnap.docs[0].id);
            setProfileMeta(extractMeta(querySnap.docs[0].data(), uid));
            setLoading(false);
          }
          return;
        }

        // 5. Fallback: treat rawParam as the UID directly
        if (mounted) {
          setTargetUid(uid);
          setProfileMeta({
            displayName: humanizeSlugWithoutIds(rawParam) || 'Boardly Student',
            username: rawUsername ? rawUsername.replace(/^@+/, '') : null,
          });
          setLoading(false);
        }
      } catch (err) {
        console.warn('[PublicUserProfilePage] resolveUid warning:', err);
        if (mounted) {
          setTargetUid(rawParam);
          setLoading(false);
        }
      }
    }

    void resolveUid();

    return () => {
      mounted = false;
    };
  }, [rawParam, rawUsername]);

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
        title="This profile is no longer available"
        message="The student account you are looking for has been deleted or does not exist."
        badge="Profile Unavailable"
      />
    );
  }

  const cleanHandle =
    profileMeta?.username ||
    (rawUsername ? rawUsername.replace(/^@+/, '') : /^[a-f0-9-]{20,}$/i.test(rawParam) ? null : rawParam);
  const sharePreview = buildProfileSharePreview({
    uid: targetUid,
    username: cleanHandle,
    displayName: profileMeta?.displayName || humanizeSlugWithoutIds(rawParam) || 'Boardly Student',
    bio: profileMeta?.bio,
    avatarUrl: profileMeta?.avatarUrl,
    role: profileMeta?.role,
    followersCount: profileMeta?.followersCount,
    postsCount: profileMeta?.postsCount,
  });

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pt-24 pb-24 px-2 sm:px-6">
      <PageMeta
        title={sharePreview.title}
        description={sharePreview.description}
        ogImage={sharePreview.image}
        ogImageAlt={sharePreview.imageAlt}
        canonicalPath={`/u/${encodeURIComponent(cleanHandle || rawParam)}`}
        ogType="profile"
      />

      <div className="max-w-4xl mx-auto mb-3 px-2 sm:px-0">
        <Breadcrumbs
          items={[
            { label: 'Commons', href: '/commons' },
            { label: profileMeta?.displayName || 'Student Profile' },
          ]}
        />
      </div>

      <ProfileView targetUid={targetUid} isFullPage={true} />
    </div>
  );
};

export default PublicUserProfilePage;


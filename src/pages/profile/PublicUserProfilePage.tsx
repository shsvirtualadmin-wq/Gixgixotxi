import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { UserPlus, UserCheck, MessageSquare, Shield, BookOpen, Lock } from 'lucide-react';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PageMeta } from '@/components/ui/PageMeta';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { BoardlyAvatar } from '@/components/ui/BoardlyAvatar';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { BannerRenderer } from '@/components/koban/artwork/bannerArtwork';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthGate } from '@/contexts/AuthGateContext';
import { followUser, unfollowUser, isFollowing } from '@/services/followService';
import { sanitizeStudentDisplayName, maskPublicUserText, buildEntitySlug } from '@/utils/privacy';
import type { CommonsPost } from '@/types/commons';

export const PublicUserProfilePage: React.FC = () => {
  const { username = '' } = useParams<{ username: string }>();
  const { user } = useAuth();
  const { requireAuth } = useAuthGate();

  const [profileData, setProfileData] = useState<Record<string, any> | null>(null);
  const [targetUid, setTargetUid] = useState<string | null>(null);
  const [userPosts, setUserPosts] = useState<CommonsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowingState, setIsFollowingState] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadPublicProfile() {
      setLoading(true);
      try {
        let uid = username.trim();
        const unameSnap = await getDoc(doc(db, 'usernames', uid.toLowerCase()));
        if (unameSnap.exists() && unameSnap.data()?.uid) {
          uid = unameSnap.data().uid;
        }

        const pubSnap = await getDoc(doc(db, 'publicProfiles', uid));
        if (!mounted) return;

        if (!pubSnap.exists()) {
          setProfileData(null);
          setLoading(false);
          return;
        }

        const data = pubSnap.data();
        setTargetUid(uid);
        setProfileData(data);

        // Fetch public non-anonymous posts by this user
        const postsQ = query(
          collection(db, 'commonsPosts'),
          where('authorUid', '==', uid),
          where('isAnonymous', '==', false),
          limit(10)
        );
        const postsSnap = await getDocs(postsQ).catch(() => null);
        if (mounted && postsSnap) {
          const list = postsSnap.docs
            .map((d) => ({ id: d.id, ...d.data() } as CommonsPost))
            .filter((p) => !(p as any).isHidden);
          setUserPosts(list);
        }

        if (user?.uid && user.uid !== uid) {
          const followingState = await isFollowing(user.uid, uid).catch(() => false);
          if (mounted) setIsFollowingState(followingState);
        }
      } catch {
        if (mounted) setProfileData(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void loadPublicProfile();
    return () => {
      mounted = false;
    };
  }, [username, user?.uid]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pt-28 pb-24 px-4">
        <div className="max-w-3xl mx-auto glass-panel p-8 h-64 animate-pulse" />
      </div>
    );
  }

  if (!profileData || !targetUid) {
    return <NotFoundPage />;
  }

  // Respect user's profile visibility setting ("public" | "logged_in" | "only_me")
  const visibility: string = profileData.profileVisibility || 'public';
  const isOwner = Boolean(user?.uid && user.uid === targetUid);

  if (visibility === 'only_me' && !isOwner) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pt-32 pb-24 px-4">
        <PageMeta
          title="Private Student Profile — Boardly"
          description="This student profile is private."
          noindex={true}
        />
        <div className="max-w-md mx-auto glass-panel p-8 text-center">
          <Shield size={28} className="text-[#D71921] mx-auto mb-3" />
          <h1 className="font-dot text-2xl font-bold text-white mb-2">Private Profile</h1>
          <p className="text-xs sm:text-sm text-white/65 mb-6">
            This student has set their profile visibility to private.
          </p>
          <Link to="/commons" className="btn-primary px-5 py-2.5 text-xs font-semibold">
            Back to Boardly Commons
          </Link>
        </div>
      </div>
    );
  }

  if (visibility === 'logged_in' && !user) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pt-32 pb-24 px-4">
        <PageMeta
          title="Sign in to View Profile — Boardly"
          description="Sign in to Boardly to view this student profile."
          noindex={true}
        />
        <div className="max-w-md mx-auto glass-panel p-8 text-center">
          <Lock size={28} className="text-[#D71921] mx-auto mb-3" />
          <h1 className="font-dot text-2xl font-bold text-white mb-2">
            Members-Only Profile
          </h1>
          <p className="text-xs sm:text-sm text-white/65 mb-6">
            This student shares their profile only with signed-in Boardly members.
          </p>
          <button
            type="button"
            onClick={() => requireAuth('view this student profile')}
            className="btn-primary px-6 py-2.5 text-xs font-semibold cursor-pointer"
          >
            Sign in to View Profile
          </button>
        </div>
      </div>
    );
  }

  // Strictly expose ONLY safe public fields (displayName, avatar, frame, banner, role, public counts)
  const safeName = sanitizeStudentDisplayName(profileData.displayName, targetUid);
  const bannerId = profileData.equipped?.banner || profileData.banner;
  const avatarId = profileData.equipped?.avatar || profileData.equippedAvatar;
  const frameId = profileData.equipped?.frame || profileData.frame;
  const role = profileData.role || 'student';
  const followersCount = Number(profileData.followersCount || 0);
  const followingCount = Number(profileData.followingCount || 0);
  const allowIndexing = Boolean(profileData.allowSearchEngineIndexing === true);

  const handleFollowToggle = async () => {
    if (!user) {
      requireAuth(`follow ${safeName}`);
      return;
    }
    if (followBusy || isOwner) return;
    setFollowBusy(true);
    try {
      if (isFollowingState) {
        await unfollowUser(user.uid, targetUid);
        setIsFollowingState(false);
      } else {
        await followUser(user.uid, targetUid);
        setIsFollowingState(true);
      }
    } finally {
      setFollowBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pt-28 pb-24 px-4 sm:px-6">
      {/* User profiles are noindex by default unless the user explicitly opted in */}
      <PageMeta
        title={`${safeName} — Student Profile on Boardly`}
        description={`View public study notes and contributions by ${safeName} on Boardly Commons.`}
        canonicalPath={`/u/${encodeURIComponent(username)}`}
        ogType="profile"
        noindex={!allowIndexing}
      />

      <div className="max-w-3xl mx-auto">
        <Breadcrumbs
          items={[
            { label: 'Commons', href: '/commons' },
            { label: safeName },
          ]}
        />

        {/* Profile Card */}
        <section className="glass-panel overflow-hidden mb-8">
          {/* Banner */}
          <div className="h-32 sm:h-40 w-full bg-white/[0.03] relative overflow-hidden border-b border-white/10">
            {bannerId ? (
              <BannerRenderer bannerId={bannerId} animated />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-[#D71921]/20 via-black to-white/[0.04]" />
            )}
          </div>

          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 sm:-mt-16 mb-5 relative z-10">
              <div className="p-1.5 rounded-full bg-[#0E0E13] border border-white/15 w-fit">
                <BoardlyAvatar
                  equippedAvatar={avatarId}
                  avatarUrl={
                    profileData.avatarUrl && !String(profileData.avatarUrl).includes('googleusercontent')
                      ? profileData.avatarUrl
                      : undefined
                  }
                  frame={frameId}
                  name={safeName}
                  size={84}
                />
              </div>

              {!isOwner ? (
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleFollowToggle}
                    disabled={followBusy}
                    className={`px-5 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center gap-2 cursor-pointer transition-all ${
                      isFollowingState
                        ? 'btn-secondary'
                        : 'btn-primary'
                    }`}
                  >
                    {isFollowingState ? <UserCheck size={15} /> : <UserPlus size={15} />}
                    <span>{isFollowingState ? 'Following' : 'Follow'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      requireAuth(`message ${safeName}`, undefined, '/dashboard/commons')
                    }
                    className="btn-secondary px-4 py-2.5 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare size={14} />
                    <span>Message</span>
                  </button>
                </div>
              ) : (
                <Link
                  to="/profile/edit"
                  className="btn-secondary px-4 py-2 text-xs font-semibold"
                >
                  Edit Profile
                </Link>
              )}
            </div>

            <div className="flex items-center gap-2.5 flex-wrap mb-2">
              <h1 className="font-dot text-2xl sm:text-3xl font-bold text-white">
                {safeName}
              </h1>
              <RoleBadge role={role} size="sm" />
            </div>

            {profileData.bio && (
              <p className="text-xs sm:text-sm text-white/70 leading-relaxed mb-5 max-w-xl">
                {maskPublicUserText(profileData.bio)}
              </p>
            )}

            {/* Public Stats Only (No private test accuracy, no email, no school/city) */}
            <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-white/10 text-xs text-white/65">
              <div>
                <strong className="text-white font-bold">{userPosts.length}</strong> Public Posts &amp; Materials
              </div>
              <div>
                <strong className="text-white font-bold">{followersCount}</strong> Followers
              </div>
              <div>
                <strong className="text-white font-bold">{followingCount}</strong> Following
              </div>
            </div>
          </div>
        </section>

        {/* Public Contributions */}
        <section className="glass-panel p-6 sm:p-8">
          <h2 className="font-dot text-xl font-bold text-white mb-4 flex items-center gap-2">
            <BookOpen size={18} className="text-[#D71921]" />
            <span>Public Contributions in Commons</span>
          </h2>

          {userPosts.length === 0 ? (
            <p className="text-xs text-white/55 py-6 text-center">
              No public posts or study materials shared yet.
            </p>
          ) : (
            <div className="space-y-3">
              {userPosts.map((post) => (
                <Link
                  key={post.id}
                  to={`/commons/post/${buildEntitySlug(post.id, post.title)}`}
                  className="glass-card-interactive p-4 block"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] font-semibold uppercase text-[#D71921]">
                      {post.subject || 'Commons'}
                    </span>
                    <span className="text-[11px] text-white/45">
                      👍 {post.upvotes || 0} · 💬 {post.commentCount || 0}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">{post.title}</h3>
                  <p className="text-xs text-white/65 line-clamp-2">
                    {maskPublicUserText(post.description)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default PublicUserProfilePage;

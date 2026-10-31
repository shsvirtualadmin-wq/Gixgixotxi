import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Award, Trophy, BookOpen, ArrowRight } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PageMeta } from '@/components/ui/PageMeta';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { BoardlyAvatar } from '@/components/ui/BoardlyAvatar';
import { RoleBadge } from '@/components/ui/RoleBadge';
import {
  getAmbassadorTestsForCreator,
  type AmbassadorTestDoc,
} from '@/services/ambassadorTestService';
import { sanitizeStudentDisplayName, buildEntitySlug } from '@/utils/privacy';

export const CaptainPublicProfilePage: React.FC = () => {
  const { username = '' } = useParams<{ username: string }>();
  const [captainProfile, setCaptainProfile] = useState<Record<string, any> | null>(null);
  const [tests, setTests] = useState<AmbassadorTestDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadCaptain() {
      setLoading(true);
      try {
        let resolvedUid = username.trim();
        const unameSnap = await getDoc(doc(db, 'usernames', resolvedUid.toLowerCase())).catch(
          () => null
        );
        if (unameSnap && unameSnap.exists() && unameSnap.data()?.uid) {
          resolvedUid = unameSnap.data().uid;
        }

        const [pubSnap, creatorTests] = await Promise.all([
          getDoc(doc(db, 'publicProfiles', resolvedUid)).catch(() => null),
          getAmbassadorTestsForCreator(resolvedUid).catch(() => []),
        ]);

        if (!mounted) return;
        const publishedTests = creatorTests.filter((t) => t.isPublic && t.status !== 'unpublished');
        setTests(publishedTests);

        if (pubSnap && pubSnap.exists()) {
          setCaptainProfile({ uid: resolvedUid, ...pubSnap.data() });
        } else if (publishedTests.length > 0) {
          setCaptainProfile({
            uid: resolvedUid,
            displayName: publishedTests[0].creatorName,
            role: 'captain',
          });
        } else {
          setCaptainProfile({
            uid: resolvedUid,
            displayName: sanitizeStudentDisplayName(username),
            role: 'captain',
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void loadCaptain();
    return () => {
      mounted = false;
    };
  }, [username]);

  const displayName = sanitizeStudentDisplayName(
    captainProfile?.displayName,
    captainProfile?.uid
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pt-28 pb-24 px-4 sm:px-6">
      <PageMeta
        title={`${displayName} — Nakama Captain & Test Author | Boardly`}
        description={`View public Grand Line mock tests and study resources published by Nakama Captain ${displayName} on Boardly.`}
        canonicalPath={`/captains/${encodeURIComponent(username)}`}
      />

      <div className="max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { label: 'Nakama Captains', href: '/captains' },
            { label: displayName },
          ]}
        />

        <section className="glass-panel p-8 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <BoardlyAvatar
              equippedAvatar={captainProfile?.equipped?.avatar}
              avatarUrl={captainProfile?.photoURL}
              frame={captainProfile?.equipped?.frame}
              name={displayName}
              size={64}
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="font-dot text-2xl sm:text-3xl font-bold text-white">
                  {displayName}
                </h1>
                <RoleBadge role="captain" size="sm" />
              </div>
              <p className="text-xs sm:text-sm text-white/65">
                Verified Boardly Nakama Captain · {tests.length} Published Grand Line Test
                {tests.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>

          <Link
            to="/captains/apply"
            className="btn-secondary px-4 py-2.5 text-xs font-semibold inline-flex items-center gap-1.5 shrink-0"
          >
            <Award size={14} className="text-[#D71921]" />
            <span>Become a Captain</span>
          </Link>
        </section>

        <section className="glass-panel p-6 sm:p-8">
          <h2 className="font-dot text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Trophy size={18} className="text-[#D71921]" />
            <span>Published Grand Line Tests</span>
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="glass-card h-32 animate-pulse" />
              ))}
            </div>
          ) : tests.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <BookOpen size={24} className="text-white/40 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white mb-1">
                No public tests published yet
              </p>
              <p className="text-xs text-white/60 mb-4">
                Explore other public tests in the Grand Line arena.
              </p>
              <Link to="/grand-line" className="btn-primary px-5 py-2 text-xs font-semibold">
                Browse Grand Line
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tests.map((test) => (
                <Link
                  key={test.id}
                  to={`/grand-line/test/${buildEntitySlug(test.id, test.title)}`}
                  className="glass-card-interactive p-5 flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[11px] font-semibold uppercase text-[#D71921]">
                      {test.subject}
                    </span>
                    <h3 className="font-dot text-lg font-bold text-white mt-1 mb-2">
                      {test.title}
                    </h3>
                  </div>
                  <div className="flex items-center justify-between text-xs text-white/60 pt-3 border-t border-white/[0.08]">
                    <span>{test.questionCount || test.questions?.length || 0} MCQs</span>
                    <span className="text-[#D71921] font-semibold inline-flex items-center gap-1">
                      <span>View Test</span>
                      <ArrowRight size={12} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default CaptainPublicProfilePage;

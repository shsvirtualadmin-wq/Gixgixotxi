import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Users, Flame, Shield, Lock, ArrowRight } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PageMeta } from '@/components/ui/PageMeta';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthGate } from '@/contexts/AuthGateContext';
import { extractIdFromSlug, buildEntitySlug, maskPublicUserText } from '@/utils/privacy';

export const CrewPublicDetailPage: React.FC = () => {
  const { idSlug } = useParams<{ idSlug: string }>();
  const crewId = extractIdFromSlug(idSlug);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { requireAuth } = useAuthGate();

  const [crew, setCrew] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    if (!crewId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getDoc(doc(db, 'crews', crewId))
      .then((snap) => {
        if (!mounted) return;
        if (snap.exists()) {
          setCrew({ id: snap.id, ...snap.data() });
        } else {
          setCrew(null);
        }
      })
      .catch(() => {
        if (mounted) setCrew(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [crewId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pt-28 pb-24 px-4">
        <div className="max-w-3xl mx-auto glass-panel p-8 h-60 animate-pulse" />
      </div>
    );
  }

  if (!crew) {
    return <NotFoundPage />;
  }

  const crewName = crew.name || crew.title || 'Boardly Study Crew';
  const canonicalPath = `/crew/${buildEntitySlug(crew.id, crewName)}`;
  const memberCount =
    crew.memberCount || (Array.isArray(crew.members) ? crew.members.length : 1);
  const points = crew.points || crew.totalPoints || crew.streak || 0;

  const handleJoinCrew = () => {
    requireAuth(
      `join the "${crewName}" Study Crew`,
      () => {
        if (crew.inviteCode) {
          navigate(`/join/${crew.inviteCode}`);
        } else {
          navigate('/crew/dashboard');
        }
      },
      crew.inviteCode ? `/join/${crew.inviteCode}` : '/crew/dashboard'
    );
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pt-28 pb-24 px-4 sm:px-6">
      <PageMeta
        title={`${crewName} — Study Crew on Boardly`}
        description={`View member count, study streak points, and join rules for ${crewName} on Boardly Study Crews.`}
        canonicalPath={canonicalPath}
      />

      <div className="max-w-3xl mx-auto">
        <Breadcrumbs
          items={[
            { label: 'Study Crews', href: '/crew' },
            { label: crewName },
          ]}
        />

        <section className="glass-panel p-8 sm:p-10 mb-8">
          <div className="section-chip-red mb-4">
            <Users size={13} />
            <span>Campus Study Squad</span>
          </div>

          <h1 className="font-dot text-3xl sm:text-4xl font-bold text-white mb-3">
            {crewName}
          </h1>

          {crew.description && (
            <p className="text-sm sm:text-base text-white/75 leading-relaxed mb-6">
              {maskPublicUserText(crew.description)}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 text-xs text-white/50 mb-1">
                <Users size={14} className="text-[#D71921]" />
                <span>Crew Members</span>
              </div>
              <p className="text-lg font-bold text-white">{memberCount} Students</p>
            </div>

            <div className="glass-card p-4">
              <div className="flex items-center gap-2 text-xs text-white/50 mb-1">
                <Flame size={14} className="text-[#D71921]" />
                <span>Crew Streak &amp; Points</span>
              </div>
              <p className="text-lg font-bold text-white">{points} pts</p>
            </div>

            <div className="glass-card p-4">
              <div className="flex items-center gap-2 text-xs text-white/50 mb-1">
                <Shield size={14} className="text-[#D71921]" />
                <span>Membership Rule</span>
              </div>
              <p className="text-sm font-bold text-white">
                {crew.isPublic === false ? 'Invite / Approval' : 'Open to Students'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleJoinCrew}
              className="btn-primary px-6 py-3 text-xs sm:text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
            >
              {!user && <Lock size={14} />}
              <span>{user ? `Join ${crewName}` : 'Sign in to Join Crew'}</span>
              <ArrowRight size={14} />
            </button>

            <Link to="/crew" className="btn-secondary px-5 py-3 text-xs sm:text-sm font-semibold">
              Explore All Study Crews
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CrewPublicDetailPage;

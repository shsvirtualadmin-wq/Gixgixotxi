import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Database,
  Award,
  CreditCard,
  FileCheck2,
  Sparkles,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  Shield,
  Activity,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  fetchAdminStats,
  seedBalancedMCQPool,
  fetchAuditLogs,
  type AdminStats,
} from '@/services/adminService';
import type { AuditLog } from '@/types';

export function AdminOverviewPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);

  // Seeder progress state
  const [seeding, setSeeding] = useState(false);
  const [seedProgress, setSeedProgress] = useState<{ done: number; total: number } | null>(null);
  const [seedSuccess, setSeedSuccess] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, logs] = await Promise.all([
        fetchAdminStats(),
        fetchAuditLogs(5),
      ]);
      setStats(s);
      setRecentLogs(logs);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSeedPool = async () => {
    if (!user?.email) return;
    setSeeding(true);
    setSeedSuccess(null);
    setSeedProgress({ done: 0, total: 500 });

    try {
      const res = await seedBalancedMCQPool(user.email, (done, total) => {
        setSeedProgress({ done, total });
      });
      setSeedSuccess(`Successfully verified & seeded all ${res.seeded} balanced questions!`);
      // Refresh stats
      await loadData();
    } catch (err: unknown) {
      console.error('Seeding error:', err);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Shield size={20} style={{ color: '#10B981' }} />
            <h1
              className="font-display"
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: 'var(--text)',
                letterSpacing: '-0.02em',
              }}
            >
              Administrator God-Mode Cockpit
            </h1>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Superpower control center for Boardly Pakistan entrance test platform.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={loadData}
          loading={loading}
        >
          <RefreshCw size={14} /> Refresh Data
        </Button>
      </div>

      {/* ── Metric Cards Grid ────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <GlassCard key={i}>
              <Skeleton height={20} width="40%" />
              <div style={{ marginTop: 12 }}>
                <Skeleton height={32} width="60%" />
              </div>
            </GlassCard>
          ))
        ) : (
          <>
            {/* Total Students */}
            <GlassCard hover>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase' }}>
                  Registered Users
                </span>
                <Users size={18} style={{ color: '#3B82F6' }} />
              </div>
              <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                {(stats?.totalUsers ?? 0).toLocaleString()}
              </p>
              <Link to="/admin/users" style={{ fontSize: 12, color: 'var(--brand)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                Manage users <ArrowRight size={12} />
              </Link>
            </GlassCard>

            {/* Questions Bank */}
            <GlassCard hover>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase' }}>
                  Questions in Pool
                </span>
                <Database size={18} style={{ color: '#10B981' }} />
              </div>
              <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                {(stats?.totalQuestions ?? 0).toLocaleString()}
              </p>
              <Link to="/admin/questions" style={{ fontSize: 12, color: '#10B981', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                Inspect questions <ArrowRight size={12} />
              </Link>
            </GlassCard>

            {/* Test Attempts */}
            <GlassCard hover>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase' }}>
                  Test Attempts
                </span>
                <Activity size={18} style={{ color: '#8B5CF6' }} />
              </div>
              <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                {(stats?.totalAttempts ?? 0).toLocaleString()}
              </p>
              <span style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 8, display: 'block' }}>
                Real attempts recorded
              </span>
            </GlassCard>

            {/* Pending Applications */}
            <GlassCard hover>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase' }}>
                  Pending Applications
                </span>
                <Award size={18} style={{ color: '#F59E0B' }} />
              </div>
              <p style={{ fontSize: 28, fontWeight: 800, color: '#F59E0B', fontVariantNumeric: 'tabular-nums' }}>
                {((stats?.pendingCaptains ?? 0) + (stats?.pendingCrew ?? 0)).toLocaleString()}
              </p>
              <Link to="/admin/applications" style={{ fontSize: 12, color: '#F59E0B', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                Review queue ({stats?.pendingCaptains ?? 0} Captains, {stats?.pendingCrew ?? 0} Crew) <ArrowRight size={12} />
              </Link>
            </GlassCard>

            {/* Pending Payments */}
            <GlassCard hover>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase' }}>
                  Pending Payments
                </span>
                <CreditCard size={18} style={{ color: '#EC4899' }} />
              </div>
              <p style={{ fontSize: 28, fontWeight: 800, color: '#EC4899', fontVariantNumeric: 'tabular-nums' }}>
                {(stats?.pendingPayments ?? 0).toLocaleString()}
              </p>
              <Link to="/admin/payments" style={{ fontSize: 12, color: '#EC4899', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                Verify transactions <ArrowRight size={12} />
              </Link>
            </GlassCard>

            {/* Pending Reviews */}
            <GlassCard hover>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase' }}>
                  Pending Reviews
                </span>
                <FileCheck2 size={18} style={{ color: '#06B6D4' }} />
              </div>
              <p style={{ fontSize: 28, fontWeight: 800, color: '#06B6D4', fontVariantNumeric: 'tabular-nums' }}>
                {(stats?.pendingReviews ?? 0).toLocaleString()}
              </p>
              <Link to="/admin/reviews" style={{ fontSize: 12, color: '#06B6D4', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                Moderate student reviews <ArrowRight size={12} />
              </Link>
            </GlassCard>
          </>
        )}
      </div>

      {/* ── 1-Click "Ensure 500+ Balanced MCQ Pool" Section ────────────── */}
      <GlassCard
        style={{
          border: '1px solid rgba(16,185,129,0.3)',
          background: 'linear-gradient(135deg, rgba(6,78,59,0.15) 0%, rgba(14,22,38,0.7) 100%)',
          padding: '24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div style={{ maxWidth: 640 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Sparkles size={18} style={{ color: '#34D399' }} />
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>
                1-Click "Ensure 500+ Balanced MCQ Pool" Tool
              </h2>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 12 }}>
              Guarantee that at least 500 verified, KaTeX-formatted entrance test questions exist in Firestore with an exact balance across:
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {[
                '125 Mathematics',
                '125 Physics',
                '125 Chemistry / CS',
                '125 English / Analytical',
                '100 FAST',
                '100 NUST',
                '100 GIKI',
                '100 LUMS',
                '100 NED/UET',
              ].map((chip) => (
                <span
                  key={chip}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    background: 'rgba(16,185,129,0.15)',
                    border: '1px solid rgba(16,185,129,0.3)',
                    color: '#A7F3D0',
                  }}
                >
                  {chip}
                </span>
              ))}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-faint)' }}>
              Uses deterministic document IDs (<code style={{ color: '#34D399' }}>seed_balanced_001</code> .. <code style={{ color: '#34D399' }}>seed_balanced_500</code>) and <code style={{ color: '#34D399' }}>setDoc(..., &#123; merge: true &#125;)</code>. It is 100% idempotent and will never delete, modify, or overwrite any of the existing ~17,000 authentic question documents.
            </p>
          </div>

          <div style={{ minWidth: 220 }}>
            <Button
              variant="primary"
              size="lg"
              onClick={handleSeedPool}
              loading={seeding}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                boxShadow: '0 4px 20px rgba(16,185,129,0.3)',
              }}
            >
              <Sparkles size={16} /> Seed Balanced Pool
            </Button>
          </div>
        </div>

        {/* Live Progress Bar */}
        {seedProgress && (
          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
              <span>Writing questions to Firestore...</span>
              <span style={{ fontWeight: 700, color: '#34D399' }}>
                {seedProgress.done} / {seedProgress.total} ({Math.round((seedProgress.done / seedProgress.total) * 100)}%)
              </span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${(seedProgress.done / seedProgress.total) * 100}%`,
                  background: 'linear-gradient(90deg, #10B981, #34D399)',
                  transition: 'width 200ms ease',
                }}
              />
            </div>
          </div>
        )}

        {seedSuccess && (
          <div
            style={{
              marginTop: 16,
              padding: '10px 14px',
              borderRadius: 'var(--r-input)',
              background: 'rgba(16,185,129,0.15)',
              border: '1px solid rgba(16,185,129,0.3)',
              color: '#34D399',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <CheckCircle2 size={16} />
            <span>{seedSuccess}</span>
          </div>
        )}
      </GlassCard>

      {/* ── Recent Audit Activity ────────────────────────────────────── */}
      <GlassCard>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={18} style={{ color: '#10B981' }} />
            <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>
              Recent Super-Admin Audit Trail
            </h2>
          </div>
          <Link to="/admin/audit-logs" style={{ fontSize: 13, color: 'var(--brand)', textDecoration: 'none' }}>
            View all logs &rarr;
          </Link>
        </div>

        {recentLogs.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-faint)', fontStyle: 'italic' }}>
            No recent admin actions recorded.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentLogs.map((log, i) => (
              <div
                key={log.id || i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 'var(--r-input)',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  fontSize: 13,
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 600,
                      background: 'rgba(16,185,129,0.15)',
                      color: '#34D399',
                    }}
                  >
                    {log.action}
                  </span>
                  <span style={{ color: 'var(--text)' }}>
                    {log.targetEmail || log.targetUid || log.adminEmail}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-faint)', fontVariantNumeric: 'tabular-nums' }}>
                  {log.timestamp && 'toDate' in log.timestamp
                    ? log.timestamp.toDate().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })
                    : 'Just now'}
                </span>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

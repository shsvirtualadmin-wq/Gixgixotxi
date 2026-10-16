import { useState, useEffect, useCallback } from 'react';
import {
  FileCheck2,
  Award,
  Users,
  CheckCircle,
  XCircle,
  RefreshCw,
  Phone,
  Mail,
  Building,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  fetchCaptainApplications,
  fetchCrewApplications,
  approveCaptainApplication,
  approveCrewApplication,
  rejectApplication,
} from '@/services/adminService';
import type { CaptainApplication, CrewApplication } from '@/types';

export function AdminApplicationsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'captain' | 'crew'>('captain');
  const [statusFilter, setStatusFilter] = useState('all');
  const [captains, setCaptains] = useState<CaptainApplication[]>([]);
  const [crew, setCrew] = useState<CrewApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'captain') {
        const data = await fetchCaptainApplications(statusFilter);
        setCaptains(data);
      } else {
        const data = await fetchCrewApplications(statusFilter);
        setCrew(data);
      }
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApproveCaptain = async (app: CaptainApplication) => {
    if (!user?.email) return;
    setActionInProgress(app.id);
    try {
      await approveCaptainApplication(user.email, app);
      await loadData();
    } catch (err) {
      console.error('Approve captain error:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleApproveCrew = async (app: CrewApplication) => {
    if (!user?.email) return;
    setActionInProgress(app.id);
    try {
      await approveCrewApplication(user.email, app);
      await loadData();
    } catch (err) {
      console.error('Approve crew error:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReject = async (type: 'captain' | 'crew', appId: string, uid: string, email: string) => {
    if (!user?.email) return;
    const reason = window.prompt('Optional rejection reason for student notification:', 'Criteria not met at this time.');
    if (reason === null) return;

    setActionInProgress(appId);
    try {
      await rejectApplication(user.email, type, appId, uid, email, reason);
      await loadData();
    } catch (err) {
      console.error('Reject application error:', err);
    } finally {
      setActionInProgress(null);
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
            <FileCheck2 size={20} style={{ color: '#F59E0B' }} />
            <h1
              className="font-display"
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: 'var(--text)',
                letterSpacing: '-0.02em',
              }}
            >
              Application Moderation Hub
            </h1>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Review, approve, or reject student candidates for Campus Captains and Boardly Crew Ambassadors.
          </p>
        </div>

        <Button variant="secondary" size="sm" onClick={loadData} loading={loading}>
          <RefreshCw size={14} /> Refresh
        </Button>
      </div>

      {/* ── Tabs & Filter ────────────────────────────────────────────── */}
      <GlassCard style={{ padding: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          {/* Main Program Tabs */}
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setActiveTab('captain')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 'var(--r-input)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                background: activeTab === 'captain' ? 'rgba(245,158,11,0.15)' : 'transparent',
                border: activeTab === 'captain' ? '1px solid #F59E0B' : '1px solid transparent',
                color: activeTab === 'captain' ? '#FBBF24' : 'var(--text-muted)',
                transition: 'all 160ms',
              }}
            >
              <Award size={15} /> Campus Captains
            </button>

            <button
              onClick={() => setActiveTab('crew')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 'var(--r-input)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                background: activeTab === 'crew' ? 'rgba(124,92,255,0.15)' : 'transparent',
                border: activeTab === 'crew' ? '1px solid #7C5CFF' : '1px solid transparent',
                color: activeTab === 'crew' ? '#C084FC' : 'var(--text-muted)',
                transition: 'all 160ms',
              }}
            >
              <Users size={15} /> Crew Ambassadors
            </button>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              borderRadius: 'var(--r-input)',
              padding: '6px 12px',
              fontSize: 13,
              outline: 'none',
            }}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </GlassCard>

      {/* ── Applications List ────────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <GlassCard key={i}>
              <Skeleton height={20} width="40%" />
              <div style={{ marginTop: 12 }}><Skeleton height={14} count={3} /></div>
            </GlassCard>
          ))}
        </div>
      ) : activeTab === 'captain' ? (
        captains.length === 0 ? (
          <GlassCard>
            <EmptyState
              title="No Captain applications found"
              description="No applications currently match the selected status filter."
            />
          </GlassCard>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {captains.map((app) => (
              <GlassCard key={app.id} style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                        {app.name}
                      </h3>
                      <Badge
                        color={app.status === 'approved' ? 'success' : app.status === 'rejected' ? 'danger' : 'warning'}
                      >
                        {app.status}
                      </Badge>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Mail size={13} /> {app.email}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Phone size={13} /> {app.phone}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Building size={13} /> {app.university}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={13} /> {app.city}
                      </span>
                    </div>
                  </div>

                  {app.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleApproveCaptain(app)}
                        loading={actionInProgress === app.id}
                        style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
                      >
                        <CheckCircle size={14} /> Approve Captain
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleReject('captain', app.id, app.userId, app.email)}
                        style={{ color: 'var(--danger)' }}
                      >
                        <XCircle size={14} /> Reject
                      </Button>
                    </div>
                  )}
                </div>

                {/* Motivation statement */}
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--r-input)',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    fontSize: 13,
                    color: 'var(--text-muted)',
                    lineHeight: 1.6,
                  }}
                >
                  <p style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4, fontSize: 12 }}>
                    Candidate Motivation & Reach:
                  </p>
                  <p>{app.motivation}</p>
                  {app.expectedReach && (
                    <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 6 }}>
                      Target audience: {app.expectedReach}
                    </p>
                  )}
                </div>
              </GlassCard>
            ))}
          </div>
        )
      ) : crew.length === 0 ? (
        <GlassCard>
          <EmptyState
            title="No Crew applications found"
            description="No applications currently match the selected status filter."
          />
        </GlassCard>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {crew.map((app) => (
            <GlassCard key={app.id} style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                      {app.name}
                    </h3>
                    <Badge
                      color={app.status === 'approved' ? 'success' : app.status === 'rejected' ? 'danger' : 'warning'}
                    >
                      {app.status}
                    </Badge>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Mail size={13} /> {app.email}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Phone size={13} /> {app.phone}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Building size={13} /> {app.college}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={13} /> {app.city}
                    </span>
                  </div>
                </div>

                {app.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleApproveCrew(app)}
                      loading={actionInProgress === app.id}
                      style={{ background: 'linear-gradient(135deg, #7C5CFF, #E879F9)' }}
                    >
                      <CheckCircle size={14} /> Approve Crew
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleReject('crew', app.id, app.userId, app.email)}
                      style={{ color: 'var(--danger)' }}
                    >
                      <XCircle size={14} /> Reject
                    </Button>
                  </div>
                )}
              </div>

              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--r-input)',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  lineHeight: 1.6,
                }}
              >
                <p style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4, fontSize: 12 }}>
                  Why they want to join Boardly Crew:
                </p>
                <p>{app.whyCrew}</p>
                {app.instagram && (
                  <p style={{ fontSize: 11, color: '#C084FC', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ExternalLink size={12} /> Instagram: {app.instagram}
                  </p>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

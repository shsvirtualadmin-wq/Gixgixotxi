import { useState, useEffect } from 'react';
import { X, ShieldAlert, Check, Sparkles, AlertTriangle, Key } from 'lucide-react';
import type { UserProfile, UserRole, UserPlan } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { updateUserOverride } from '@/services/adminService';
import { Timestamp } from 'firebase/firestore';

interface UserOverrideDrawerProps {
  user: UserProfile | null;
  adminEmail: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function UserOverrideDrawer({
  user,
  adminEmail,
  onClose,
  onSuccess,
}: UserOverrideDrawerProps) {
  const [role, setRole] = useState<UserRole>('student');
  const [plan, setPlan] = useState<UserPlan>('free');
  const [isSuspended, setIsSuspended] = useState<boolean>(false);
  const [proDurationDays, setProDurationDays] = useState<number>(30);
  const [targetUniversity, setTargetUniversity] = useState<string>('');
  const [targetTestDate, setTargetTestDate] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setRole(user.role || 'student');
      setPlan(user.plan || 'free');
      setIsSuspended(!!(user.suspended || user.isSuspended));
      setTargetUniversity(user.targetUniversity || '');
      setTargetTestDate(user.targetTestDate || '');
      setError(null);
    }
  }, [user]);

  if (!user) return null;

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const updates: Partial<UserProfile> = {
        role,
        plan,
        suspended: isSuspended,
        isSuspended: isSuspended,
        targetUniversity: targetUniversity.trim() || undefined,
        targetTestDate: targetTestDate.trim() || undefined,
      };

      if (plan === 'pro') {
        updates.isPremium = true;
        updates.premiumSource = 'admin_override';
        const ms = proDurationDays === 9999
          ? Date.now() + 100 * 365 * 24 * 60 * 60 * 1000 // lifetime
          : Date.now() + proDurationDays * 24 * 60 * 60 * 1000;
        updates.premiumExpiresAt = Timestamp.fromMillis(ms);
      } else {
        updates.isPremium = false;
        updates.premiumSource = null;
        updates.premiumExpiresAt = null;
      }

      const previous: Partial<UserProfile> = {
        role: user.role,
        plan: user.plan,
        isPremium: user.isPremium,
        suspended: user.suspended,
        isSuspended: user.isSuspended,
        targetUniversity: user.targetUniversity,
      };

      await updateUserOverride(adminEmail, user.uid, user.email, updates, previous);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error('Failed to update user override:', err);
      setError((err as Error).message || 'Failed to update user profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      {/* Backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
        }}
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div
        className="glass"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 480,
          height: '100%',
          background: 'var(--bg-2)',
          borderLeft: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
          overflowY: 'auto',
          zIndex: 101,
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Key size={16} style={{ color: '#10B981' }} />
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>
                User Overrides & God-Mode
              </h3>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-faint)', fontFamily: 'monospace' }}>
              UID: {user.uid}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* User Profile Summary */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--r-card)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--brand), var(--brand-2))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                fontWeight: 700,
                color: 'white',
                flexShrink: 0,
              }}
            >
              {(user.displayName || user.email || 'U')[0].toUpperCase()}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.displayName || 'Unnamed Student'}
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.email}
              </p>
            </div>
            <div>
              {isSuspended ? (
                <Badge color="danger">Suspended</Badge>
              ) : (
                <Badge color="success">Active</Badge>
              )}
            </div>
          </div>

          {error && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--r-input)',
                background: 'rgba(248,113,113,0.15)',
                border: '1px solid rgba(248,113,113,0.3)',
                color: 'var(--danger)',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Form Controls */}
          {/* 1. Role Selection */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              Account Role
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {(['student', 'crew', 'captain', 'admin'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  style={{
                    padding: '10px',
                    borderRadius: 'var(--r-input)',
                    fontSize: 13,
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    cursor: 'pointer',
                    transition: 'all 160ms',
                    background: role === r ? 'rgba(16,185,129,0.15)' : 'var(--surface)',
                    border: role === r ? '1px solid #10B981' : '1px solid var(--border)',
                    color: role === r ? '#34D399' : 'var(--text-muted)',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Plan & Pro Privileges */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              Plan & Pro Access
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              <button
                type="button"
                onClick={() => setPlan('free')}
                style={{
                  padding: '10px',
                  borderRadius: 'var(--r-input)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: plan === 'free' ? 'rgba(255,255,255,0.1)' : 'var(--surface)',
                  border: plan === 'free' ? '1px solid var(--text)' : '1px solid var(--border)',
                  color: plan === 'free' ? 'var(--text)' : 'var(--text-muted)',
                }}
              >
                Free Tier
              </button>
              <button
                type="button"
                onClick={() => setPlan('pro')}
                style={{
                  padding: '10px',
                  borderRadius: 'var(--r-input)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  background: plan === 'pro' ? 'rgba(47,107,255,0.2)' : 'var(--surface)',
                  border: plan === 'pro' ? '1px solid var(--brand)' : '1px solid var(--border)',
                  color: plan === 'pro' ? '#60A5FA' : 'var(--text-muted)',
                }}
              >
                <Sparkles size={14} /> Pro Tier
              </button>
            </div>

            {plan === 'pro' && (
              <div
                style={{
                  padding: 12,
                  borderRadius: 'var(--r-input)',
                  background: 'rgba(47,107,255,0.08)',
                  border: '1px solid rgba(47,107,255,0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Grant Duration:</span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[
                    { label: '30 Days', days: 30 },
                    { label: '90 Days', days: 90 },
                    { label: '1 Year', days: 365 },
                    { label: 'Lifetime', days: 9999 },
                  ].map((d) => (
                    <button
                      key={d.days}
                      type="button"
                      onClick={() => setProDurationDays(d.days)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: proDurationDays === d.days ? 'var(--brand)' : 'var(--surface)',
                        color: proDurationDays === d.days ? 'white' : 'var(--text-muted)',
                        border: 'none',
                      }}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. Account Suspension Toggle */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              Account Security Status
            </label>
            <div
              style={{
                padding: 14,
                borderRadius: 'var(--r-input)',
                background: isSuspended ? 'rgba(248,113,113,0.1)' : 'var(--surface)',
                border: isSuspended ? '1px solid rgba(248,113,113,0.3)' : '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShieldAlert size={18} style={{ color: isSuspended ? 'var(--danger)' : 'var(--text-faint)' }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                    {isSuspended ? 'Account is Suspended' : 'Account is Active'}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {isSuspended ? 'Student is prevented from logging in' : 'Student has standard login access'}
                  </p>
                </div>
              </div>
              <Button
                variant={isSuspended ? 'ghost' : 'danger'}
                size="sm"
                onClick={() => setIsSuspended(!isSuspended)}
              >
                {isSuspended ? 'Unsuspend' : 'Suspend'}
              </Button>
            </div>
          </div>

          {/* 4. Target Exam Information */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              Target University & Test Date
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="text"
                value={targetUniversity}
                onChange={(e) => setTargetUniversity(e.target.value)}
                placeholder="e.g. FAST-NUCES, NUST NET"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--r-input)',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  fontSize: 13,
                }}
              />
              <input
                type="date"
                value={targetTestDate}
                onChange={(e) => setTargetTestDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--r-input)',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  fontSize: 13,
                }}
              />
            </div>
          </div>
        </div>

        {/* Drawer Actions */}
        <div
          style={{
            marginTop: 'auto',
            padding: '20px 24px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            gap: 12,
          }}
        >
          <Button variant="secondary" size="md" onClick={onClose} style={{ flex: 1 }}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            loading={saving}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, #10B981, #14B8A6)',
            }}
          >
            <Check size={16} /> Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Sun, Moon, Check, Save } from 'lucide-react';

const PAKISTANI_UNIVERSITIES = [
  'FAST-NUCES (CS/SE/AI/DS)',
  'NUST NET (Engineering & Computing)',
  'GIKI (Top Engineering & CS)',
  'LUMS (SBASSE / SDSB)',
  'NED University Karachi',
  'MDCAT (UHS / PMDC / NUMS)',
  'ECAT Punjab (UET Lahore)',
  'PIEAS Islamabad',
  'COMSATS University',
  'Habib University',
  'IBA Karachi',
  'AKU (Aga Khan University)',
];

import { useTheme } from '@/hooks/useTheme';

export function SettingsPage() {
  const { signOutUser } = useAuth();
  const { user, profile, loading: profileLoading, updateProfileData } = useUserProfile();

  const [displayName, setDisplayName] = useState('');
  const [targetUniversity, setTargetUniversity] = useState('');
  const [targetTestDate, setTargetTestDate] = useState('');
  const { theme, setTheme: toggleTheme } = useTheme();
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || user?.displayName || '');
      setTargetUniversity(profile.targetUniversity || '');
      setTargetTestDate(profile.targetTestDate || '');
    }
  }, [profile, user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSavedSuccess(false);

    try {
      await updateProfileData({
        displayName: displayName.trim(),
        targetUniversity: targetUniversity.trim(),
        targetTestDate: targetTestDate.trim(),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('[SettingsPage] Error saving profile:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 className="font-display" style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
          Profile & Preferences
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
          Manage your student target exam, target test date, and appearance.
        </p>
      </div>

      {profileLoading ? (
        <Skeleton height={200} />
      ) : (
        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Theme Settings (Nothing OS Dark / Light) */}
          <GlassCard style={{ padding: '24px' }}>
            <h3 className="font-display" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
              Appearance
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              Select Nothing OS monochrome dark mode or high-contrast light mode.
            </p>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                onClick={() => toggleTheme('dark')}
                style={{
                  flex: 1,
                  padding: '16px',
                  borderRadius: 'var(--r-card)',
                  background: '#000000',
                  border: theme === 'dark' ? '2px solid #D71921' : '1px solid #333333',
                  color: '#F2F2F2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                <Moon size={18} />
                <span>Nothing Dark</span>
                {theme === 'dark' && <Check size={16} className="text-[#D71921]" />}
              </button>

              <button
                type="button"
                onClick={() => toggleTheme('light')}
                style={{
                  flex: 1,
                  padding: '16px',
                  borderRadius: 'var(--r-card)',
                  background: '#F2F2F2',
                  border: theme === 'light' ? '2px solid #D71921' : '1px solid #CCCCCC',
                  color: '#000000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                <Sun size={18} />
                <span>Nothing Light</span>
                {theme === 'light' && <Check size={16} className="text-[#D71921]" />}
              </button>
            </div>
          </GlassCard>

          {/* Academic Profile */}
          <GlassCard style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <h3 className="font-display" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
              Target University & Schedule
            </h3>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                Full Name / Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Ayesha Khan"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--r-input)',
                  background: 'var(--surface-hover)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  fontSize: 14,
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                Primary Target Exam / University
              </label>
              <select
                value={targetUniversity}
                onChange={(e) => setTargetUniversity(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--r-input)',
                  background: 'var(--surface-hover)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  fontSize: 14,
                  outline: 'none',
                }}
              >
                <option value="">Select target university...</option>
                {PAKISTANI_UNIVERSITIES.map((uni) => (
                  <option key={uni} value={uni}>
                    {uni}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                Expected Test Date (for countdown)
              </label>
              <input
                type="date"
                value={targetTestDate}
                onChange={(e) => setTargetTestDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--r-input)',
                  background: 'var(--surface-hover)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  fontSize: 14,
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
              {savedSuccess ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--success)', fontSize: 13, fontWeight: 600 }}>
                  <Check size={16} /> Saved successfully!
                </span>
              ) : (
                <span />
              )}
              <Button variant="primary" size="md" type="submit" loading={saving}>
                <Save size={14} /> Save Preferences
              </Button>
            </div>
          </GlassCard>

          {/* Account Details & Sign Out */}
          <GlassCard style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{user?.email}</p>
              <p style={{ fontSize: 12, color: 'var(--text-faint)', fontFamily: 'monospace' }}>
                UID: {user?.uid}
              </p>
            </div>
            <Button variant="danger" size="sm" onClick={() => signOutUser()}>
              Sign Out
            </Button>
          </GlassCard>
        </form>
      )}
    </div>
  );
}

export default SettingsPage;

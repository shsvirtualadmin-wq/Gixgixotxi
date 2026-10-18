import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Sun, Moon, Check, Save, LogOut, Trash2, AlertTriangle, X } from 'lucide-react';
import { formatStudentId } from '@/utils/shortId';
import { wipeStudentAccount } from '@/services/userAccountService';

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
  const navigate = useNavigate();
  const { signOutUser } = useAuth();
  const { user, profile, loading: profileLoading, updateProfileData } = useUserProfile();

  const [displayName, setDisplayName] = useState('');
  const [targetUniversity, setTargetUniversity] = useState('');
  const [targetTestDate, setTargetTestDate] = useState('');
  const { theme, setTheme: toggleTheme } = useTheme();
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Account Deletion & Logout
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleLogout = async () => {
    await signOutUser();
    navigate('/login');
  };

  const handleConfirmDelete = async () => {
    if (!user) return;
    setDeletingAccount(true);
    setDeleteError(null);
    try {
      await wipeStudentAccount(user.uid);
      await signOutUser();
      navigate('/');
    } catch (err) {
      console.error('[SettingsPage] Delete account error:', err);
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete account. Please try again.');
      setDeletingAccount(false);
    }
  };

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
        targetUniversity: targetUniversity.trim() || undefined,
        targetTestDate: targetTestDate.trim() || undefined,
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

          {/* Account Details & Session Actions */}
          <GlassCard style={{ padding: '20px 24px' }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{user?.email}</p>
                <p className="text-xs font-mono text-[var(--muted)] mt-1 flex items-center gap-1.5">
                  <span>Student ID:</span>
                  <span className="font-bold text-[var(--text)] px-2 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border)]">
                    {formatStudentId(profile || user?.uid)}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <Button
                  variant="outline"
                  size="md"
                  type="button"
                  onClick={handleLogout}
                  className="cursor-pointer"
                >
                  <LogOut size={15} />
                  <span>Log Out</span>
                </Button>
              </div>
            </div>
          </GlassCard>

          {/* Danger Zone: Account Deletion */}
          <GlassCard style={{ padding: '20px 24px', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-red-400 flex items-center gap-2">
                  <AlertTriangle size={16} />
                  <span>Danger Zone</span>
                </h4>
                <p className="text-xs text-[var(--muted)] mt-1 max-w-md leading-relaxed">
                  Permanently delete your Boardly student account, test attempts, streaks, and squad data. This action is irreversible.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(true)}
                className="px-4 py-2.5 rounded-xl border border-red-500/50 hover:bg-red-500/10 text-red-400 hover:text-red-300 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Trash2 size={14} />
                <span>Delete My Account</span>
              </button>
            </div>
          </GlassCard>
        </form>
      )}

      {/* Delete Account Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-[var(--card)] border border-red-500/40 p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5 text-red-500">
                <AlertTriangle size={22} className="shrink-0" />
                <h3 className="text-lg font-bold font-display text-[var(--text)]">Delete Account Confirmation</h3>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--muted)] hover:text-white"
              >
                <X size={15} />
              </button>
            </div>

            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Are you sure you want to delete your account? All your personal data—including profile settings, test attempts, streak records, crew membership, and ambassador status—will be wiped immediately.
            </p>

            <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/30 text-[11px] text-red-300">
              Type <strong className="text-white font-mono">DELETE</strong> below to confirm.
            </div>

            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text)] focus:outline-none focus:border-red-500"
            />

            {deleteError && (
              <p className="text-xs text-red-400">{deleteError}</p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deletingAccount}
              >
                Cancel
              </Button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deletingAccount || deleteConfirmText.trim() !== 'DELETE'}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={14} />
                <span>{deletingAccount ? 'Wiping Data...' : 'Yes, Delete My Account'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsPage;

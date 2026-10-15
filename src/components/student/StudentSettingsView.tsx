import React, { useState } from 'react';
import {
  Settings,
  User,
  Shield,
  Sun,
  Moon,
  RefreshCw,
  LogOut,
  CheckCircle2,
  Lock,
  Calendar,
  Save,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db, logFirestoreError } from '../../lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { UNIVERSITIES } from '../../data/universities';

export const StudentSettingsView: React.FC = () => {
  const { user, profile, refreshProfile, logOut } = useAuth();

  // Profile Form state
  const [displayName, setDisplayName] = useState<string>(profile?.name || user?.displayName || '');
  const [phone, setPhone] = useState<string>(profile?.phone || '');
  const [targetUni, setTargetUni] = useState<string>(profile?.targetUniversity || 'FAST');
  const [targetExamDate, setTargetExamDate] = useState<string>(profile?.targetExamDate || profile?.examDate || '');
  const [testTrack, setTestTrack] = useState<string>(profile?.testTrack || 'Pre-Engineering');

  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [profileSuccess, setProfileSuccess] = useState<boolean>(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password state
  const [newPassword, setNewPassword] = useState<string>('');
  const [isChangingPass, setIsChangingPass] = useState<boolean>(false);
  const [passSuccess, setPassSuccess] = useState<boolean>(false);
  const [passError, setPassError] = useState<string | null>(null);

  // PhoneMockup Reset State
  const [mockupResetDone, setMockupResetDone] = useState<boolean>(false);

  // Theme Toggle State
  const [currentTheme, setCurrentTheme] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('boardly_theme') || 'dark';
    }
    return 'dark';
  });

  const handleToggleTheme = () => {
    const next = currentTheme === 'dark' ? 'light' : 'dark';
    setCurrentTheme(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('boardly_theme', next);
      if (next === 'light') {
        document.documentElement.classList.add('tinted-light');
      } else {
        document.documentElement.classList.remove('tinted-light');
      }
    }
  };

  const handleResetMockup = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('boardly_hide_mockup');
      setMockupResetDone(true);
      setTimeout(() => setMockupResetDone(false), 2500);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || isSavingProfile) return;

    setIsSavingProfile(true);
    setProfileSuccess(false);
    setProfileError(null);
    const path = `users/${user.uid}`;

    // ONLY safe, student-allowed fields
    const safePayload = {
      name: displayName.trim(),
      displayName: displayName.trim(),
      phone: phone.trim(),
      targetUniversity: targetUni,
      targetExamDate,
      examDate: targetExamDate,
      testTrack,
      stream: testTrack,
      updatedAt: new Date().toISOString(),
    };

    try {
      await updateDoc(doc(db, 'users', user.uid), safePayload);
      await refreshProfile();
      setProfileSuccess(true);
    } catch (err: any) {
      logFirestoreError(path, err, 'update_student_profile');
      setProfileError(err?.message || 'Could not update profile fields.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPassword || isChangingPass) return;
    if (newPassword.length < 8) {
      setPassError('Password must be at least 8 characters long.');
      return;
    }

    setIsChangingPass(true);
    setPassSuccess(false);
    setPassError(null);

    try {
      await updatePassword(user, newPassword);
      setPassSuccess(true);
      setNewPassword('');
    } catch (err: any) {
      setPassError(err?.message || 'Could not update password. You may need to log out and log in again.');
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <div className="space-y-6 text-left font-sans max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight font-display flex items-center gap-2">
            <span>Account Profile & Settings</span>
            <Settings className="w-6 h-6 text-[var(--brand-2)]" />
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            Manage your personal academic target, password, theme preferences, and security settings.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Academic Profile Card */}
        <Card variant="glass" className="p-6 space-y-4">
          <div className="border-b border-white/8 pb-3 flex items-center justify-between">
            <h3 className="text-base font-bold text-white font-display">Academic Preferences</h3>
            <Badge variant="student" size="sm">
              Verified Student
            </Badge>
          </div>

          {profileSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Academic profile updated successfully!</span>
            </div>
          )}

          {profileError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
              {profileError}
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--text-muted)]">Full Name</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--text-muted)]">Phone Number</label>
              <input
                type="text"
                placeholder="0300-1234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--text-muted)]">Target University</label>
              <select
                value={targetUni}
                onChange={(e) => setTargetUni(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-semibold"
              >
                {UNIVERSITIES.map((u) => (
                  <option key={u.id} value={u.shortName} className="bg-[#0E1626]">
                    {u.fullName} ({u.shortName})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--text-muted)]">Expected Entry Test Date</label>
              <input
                type="date"
                value={targetExamDate}
                onChange={(e) => setTargetExamDate(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="primary" size="md" type="submit" isLoading={isSavingProfile}>
                Save Preferences
              </Button>
            </div>
          </form>
        </Card>

        {/* Security & System Settings Card */}
        <div className="space-y-6">
          {/* Password Update */}
          <Card variant="glass" className="p-6 space-y-4">
            <div className="border-b border-white/8 pb-3">
              <h3 className="text-base font-bold text-white font-display">Security Credentials</h3>
              <p className="text-xs text-[var(--text-muted)]">Account email: {user?.email}</p>
            </div>

            {passSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Password updated successfully!</span>
              </div>
            )}

            {passError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                {passError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-muted)]">New Password</label>
                <input
                  type="password"
                  placeholder="Min 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white"
                />
              </div>

              <div className="flex justify-end pt-1">
                <Button variant="secondary" size="md" type="submit" isLoading={isChangingPass}>
                  Update Password
                </Button>
              </div>
            </form>
          </Card>

          {/* Preferences & Theme Toggle */}
          <Card variant="glass" className="p-6 space-y-4">
            <div className="border-b border-white/8 pb-3">
              <h3 className="text-base font-bold text-white font-display">Interface Preferences</h3>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/8">
              <div>
                <h4 className="text-xs font-bold text-white">Visual Mode</h4>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {currentTheme === 'dark' ? 'Dark Glass Cockpit' : 'Tinted Light Theme'}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleToggleTheme}
                leftIcon={currentTheme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                {currentTheme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/8">
              <div>
                <h4 className="text-xs font-bold text-white">Hardware Preview Card</h4>
                <p className="text-[11px] text-[var(--text-muted)]">Restore the dismissed overview preview card</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetMockup}
                className="text-xs"
              >
                {mockupResetDone ? 'Restored!' : 'Restore'}
              </Button>
            </div>

            <div className="pt-2 border-t border-white/8">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logOut()}
                leftIcon={<LogOut className="w-4 h-4 text-red-400" />}
                className="text-red-400 hover:bg-red-500/10 text-xs"
              >
                Sign Out of All Devices
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

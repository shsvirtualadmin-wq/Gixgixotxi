import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { saveProfileIdentity } from '@/services/userService';
import { GraduationCap, BookOpen, Heart, User, Check, X, Shield } from 'lucide-react';

export const RoleSelectionPromptModal: React.FC = () => {
  const { user, isAdmin, updateLocalProfile } = useAuth();
  const { profile } = useUserProfile();

  const [selectedRole, setSelectedRole] = useState<'Student' | 'Teacher' | 'Parent' | 'Other'>('Student');
  const [customRole, setCustomRole] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined' || !user?.uid) return false;
    return !!localStorage.getItem(`boardly_chosen_role_${user.uid}`);
  });

  // If user is not logged in, profile not loaded, or user already has chosen a role, don't show
  if (!user || !profile || profile.hasChosenRole || dismissed) {
    return null;
  }

  // If user is superadmin, they already have an assigned role
  const isSuperAdminEmail = user.email && (
    user.email.toLowerCase() === 'support@scholario.me' ||
    user.email.toLowerCase() === 'support@boardly.cfd' ||
    user.email.toLowerCase() === 'shsvirtualadmin@gmail.com'
  );
  if (isAdmin || isSuperAdminEmail || profile.role === 'admin' || profile.role === 'superadmin') {
    return null;
  }

  const handleSave = async () => {
    if (selectedRole === 'Other' && !customRole.trim()) {
      setError('Please specify your custom role (max 20 characters).');
      return;
    }

    setSaving(true);
    setError(null);

    const nickname = profile.nickname || profile.displayName || user.displayName || 'Student';
    const username = profile.username || `user_${user.uid.slice(0, 6).toLowerCase()}`;
    const effectiveCustomRole = selectedRole === 'Other' ? customRole.trim().slice(0, 20) : null;
    const effectiveRole = selectedRole === 'Other' ? (effectiveCustomRole || 'Other') : selectedRole;

    // Optimistically update local profile and persist choice
    try {
      updateLocalProfile({
        role: effectiveRole,
        customRole: effectiveCustomRole,
        hasChosenRole: true,
        displayName: nickname,
        nickname,
        username,
      });
      localStorage.setItem(`boardly_chosen_role_${user.uid}`, selectedRole);
    } catch {
      // Ignore local storage error
    }

    try {
      const res = await saveProfileIdentity(
        user.uid,
        {
          role: selectedRole,
          customRole: effectiveCustomRole,
          nickname,
          username,
        },
        isAdmin
      );

      if (!res.success) {
        if (res.error && res.error.toLowerCase().includes('permission')) {
          // Rule/permission mismatch: local profile is updated, dismiss so user is not blocked
          setDismissed(true);
        } else {
          setError(res.error || 'Failed to save role.');
        }
      } else {
        setDismissed(true);
      }
    } catch (err: any) {
      console.warn('[RoleSelectionPromptModal] Non-fatal save notice:', err);
      // If error is permission-related, avoid locking the user
      if (err?.message && err.message.toLowerCase().includes('permission')) {
        setDismissed(true);
      } else {
        setError(err?.message || 'Failed to save role.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    setDismissed(true);
    try {
      localStorage.setItem(`boardly_chosen_role_${user.uid}`, 'Student');
    } catch {
      // Ignore local storage error
    }

    const nickname = profile.nickname || profile.displayName || user.displayName || 'Student';
    const username = profile.username || `user_${user.uid.slice(0, 6).toLowerCase()}`;

    updateLocalProfile({
      role: 'Student',
      hasChosenRole: true,
      displayName: nickname,
      nickname,
      username,
    });

    await saveProfileIdentity(
      user.uid,
      {
        role: 'Student',
        nickname,
        username,
      },
      isAdmin
    ).catch((e) => {
      console.warn('[RoleSelectionPromptModal] Skip identity save notice:', e);
    });
  };

  const roles = [
    { id: 'Student' as const, label: 'Student', desc: 'Preparing for FSC, Matric, or entry exams', icon: GraduationCap },
    { id: 'Teacher' as const, label: 'Teacher', desc: 'Educator, mentor, or academy instructor', icon: BookOpen },
    { id: 'Parent' as const, label: 'Parent', desc: 'Supporting a student’s academic journey', icon: Heart },
    { id: 'Other' as const, label: 'Other', desc: 'Custom educational or community role', icon: User },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-surface border border-border p-6 shadow-2xl flex flex-col gap-5 text-primary">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold font-sans text-primary">Choose Your Role</h2>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              Select your role on Boardly to personalize your profile identity. You can change this anytime in Settings.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSkip}
            className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted hover:text-primary transition-colors cursor-pointer"
            title="Dismiss (default to Student)"
          >
            <X size={15} />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-500 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {roles.map((r) => {
            const isSelected = selectedRole === r.id;
            const Icon = r.icon;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedRole(r.id)}
                className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#D71921] bg-[#D71921]/10 text-primary shadow-xs'
                    : 'border-border bg-surface-muted hover:border-border-strong text-muted hover:text-primary'
                }`}
              >
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    isSelected ? 'bg-[#D71921] text-white' : 'bg-surface border border-border text-muted'
                  }`}
                >
                  <Icon size={16} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <span>{r.label}</span>
                    {isSelected && <Check size={13} className="text-[#D71921]" />}
                  </div>
                  <p className="text-[11px] text-muted mt-0.5 line-clamp-2 leading-tight">
                    {r.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {selectedRole === 'Other' && (
          <div className="flex flex-col gap-1.5 animate-in fade-in duration-150">
            <label className="text-xs font-medium text-muted">
              Custom Role Title (max 20 characters)
            </label>
            <input
              type="text"
              maxLength={20}
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              placeholder="e.g. Mentor, Tutor, Counselor"
              className="w-full px-3.5 py-2 rounded-xl bg-input-bg border border-border text-sm text-primary placeholder:text-placeholder focus:outline-none focus:border-[#D71921]"
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
          <button
            type="button"
            onClick={handleSkip}
            className="px-4 py-2 rounded-xl text-xs font-medium text-muted hover:text-primary transition-colors cursor-pointer"
          >
            I'm a Student (Skip)
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-[#D71921] hover:bg-[#B8141B] disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
          >
            <Check size={14} />
            <span>{saving ? 'Saving...' : 'Confirm Role'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

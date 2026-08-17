import React from 'react';
import {
  supabase,
  isAdminEmail,
  StudentProfile,
  User,
} from '../lib/supabase';
import { StudentProfileView } from './StudentProfileView';
import { ShieldCheck } from 'lucide-react';

interface LmsDashboardProps {
  user: User;
  profile: StudentProfile | null;
  onStartPractice?: () => void;
  onOpenAdminDashboard?: () => void;
  onRefreshProfile: () => void;
  onLogout: () => void;
  initialTab?: 'profile' | 'dashboard';
  isTestLimitReached?: boolean;
}

export const LmsDashboard: React.FC<LmsDashboardProps> = ({
  user,
  profile,
  onStartPractice,
  onOpenAdminDashboard,
  onRefreshProfile,
  onLogout,
}) => {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  const displayName = profile?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student';
  const isAdmin = isAdminEmail(user?.email);

  const defaultProfile: StudentProfile = profile || {
    id: user.id,
    name: displayName,
    email: user.email || '',
    grade: '11th / Grade 11',
    stream: 'Pre-Medical Stream',
    subjects: ['Biology', 'Chemistry', 'Physics', 'English', 'Urdu', 'Islamiat'],
    sign_up_method: 'Google',
    status: 'active',
    is_registered: true,
    created_at: new Date().toISOString(),
  };

  return (
    <div className="animate-ios-spring text-left space-y-4">
      {/* Admin Quick Banner */}
      {isAdmin && onOpenAdminDashboard && (
        <button
          type="button"
          onClick={onOpenAdminDashboard}
          className="w-full bg-[#1E5AFF]/10 hover:bg-[#1E5AFF]/20 border border-[#1E5AFF]/30 text-[#1E5AFF] font-extrabold py-2.5 px-4 rounded-2xl flex items-center justify-between transition-all cursor-pointer text-xs active:scale-[0.98]"
        >
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#1E5AFF]" />
            <span>Boardly Admin Management Portal</span>
          </span>
          <span className="bg-[#1E5AFF] text-white px-2.5 py-0.5 rounded-full font-extrabold text-[10px] shadow-sm">
            Open &rarr;
          </span>
        </button>
      )}

      {/* Student Profile Content */}
      <StudentProfileView
        user={user}
        profile={defaultProfile}
        onRefreshProfile={onRefreshProfile}
        onStartPractice={onStartPractice}
        onSignOut={handleSignOut}
      />
    </div>
  );
};



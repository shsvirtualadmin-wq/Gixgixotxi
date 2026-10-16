import { type ReactNode } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';

interface AdminGuardProps {
  children: ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, profileLoading, isAdmin } = useAuth();

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-6">
        <div className="w-full max-w-[420px] p-6 rounded-[24px] bg-[var(--card)] border border-[var(--border)]">
          <Skeleton height={28} width="60%" />
          <div className="mt-4 space-y-2">
            <Skeleton height={14} count={3} />
          </div>
        </div>
      </div>
    );
  }

  // Not logged in -> redirect to login with return parameter
  if (!user) {
    return <Navigate to="/login?redirect=/admin" replace />;
  }

  // Logged in but not super-admin -> display forbidden error
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-4 sm:p-6">
        <div className="max-w-[480px] w-full p-6 sm:p-8 rounded-[24px] bg-[var(--card)] border border-[var(--border)] text-center shadow-none">
          <div className="w-14 h-14 rounded-full bg-[var(--card-2)] border border-[var(--red)]/40 text-[var(--red)] flex items-center justify-center mx-auto mb-5">
            <ShieldAlert size={28} />
          </div>

          <h1 className="font-dot text-[22px] font-bold text-[var(--text)] mb-3">
            Admin access restricted
          </h1>

          <p className="font-heading text-[14px] text-[var(--muted)] leading-relaxed mb-5">
            This portal is strictly reserved for the Boardly platform super-administrator.
            Your account (<strong className="text-[var(--text)] font-semibold">{user.email}</strong>) does not have administrator authority.
          </p>

          <div className="bg-[var(--card-2)] p-3 rounded-[12px] border border-[var(--border)] text-[12px] font-heading text-[var(--muted)] mb-6">
            Authorized: shsvirtualadmin@gmail.com
          </div>

          <Link to="/dashboard" className="inline-block w-full">
            <Button variant="secondary" size="md" className="w-full justify-center">
              <ArrowLeft size={16} /> Return to student dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default AdminGuard;

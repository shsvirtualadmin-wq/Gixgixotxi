import type { ReactNode } from 'react';

interface AdminGuardProps {
  children: ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  // Authentication & role authorization checks are integrated directly into the persistent AdminLayout shell
  // so the sidebar and navigation never unmount or blink black.
  return <>{children}</>;
}

export default AdminGuard;

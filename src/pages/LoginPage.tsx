import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthCard } from '@/components/auth/AuthCard';

export function LoginPage() {
  return (
    <AuthLayout>
      <AuthCard initialMode="signin" />
    </AuthLayout>
  );
}

export default LoginPage;

import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthCard } from '@/components/auth/AuthCard';

export function SignupPage() {
  return (
    <AuthLayout>
      <AuthCard initialMode="signup" />
    </AuthLayout>
  );
}

export default SignupPage;

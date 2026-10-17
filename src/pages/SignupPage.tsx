import { Navigate } from 'react-router-dom';

/**
 * No registration portal: All user signup/creation is handled seamlessly
 * on first login (email or Google). Redirect any /signup requests straight to /login.
 */
export function SignupPage() {
  return <Navigate to="/login" replace />;
}

export default SignupPage;

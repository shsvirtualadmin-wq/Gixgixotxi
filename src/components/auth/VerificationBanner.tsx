export function VerificationBanner() {
  // Email verification is enforced once at sign-up before entering the dashboard,
  // so verified users inside the dashboard never see the legacy banner.
  return null;
}


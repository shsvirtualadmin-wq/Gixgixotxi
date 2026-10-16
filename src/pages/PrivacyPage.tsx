import { GlassCard } from '../components/ui/GlassCard';
import { Badge } from '../components/ui/Badge';

export function PrivacyPage() {
  return (
    <div className="site-container pt-28 pb-20 max-w-4xl page-enter space-y-8">
      <div className="space-y-3">
        <Badge color="brand">Legal</Badge>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">
          Privacy Policy
        </h1>
        <p className="text-sm text-[var(--text-faint)]">Last updated: October 2026</p>
      </div>

      <GlassCard className="p-8 space-y-6 text-sm text-[var(--text-muted)] leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">1. Information We Collect</h2>
          <p>
            When you register for Boardly, we collect basic profile details including your name, email address, target university, and target examination date. When solving practice tests, we store your score, accuracy rate, and question-level responses to power your study analytics.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">2. Use of Information</h2>
          <p>
            We use your data strictly to tailor your practice recommendations, compute campus aggregate projections, maintain daily practice quotas, and rank live Arena simulations. We never sell or rent your personal information to third parties or marketing brokers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">3. Public Arena &amp; Privacy Masking</h2>
          <p>
            To protect your privacy during national Blitz mocks and leaderboards, your display name is permanently masked (e.g. &ldquo;Hamza K.&rdquo;) and your email is never shown publicly to other students.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">4. Data Security</h2>
          <p>
            Your account authentication is secured via Firebase Authentication with encrypted token sessions. All application traffic is served over HTTPS encrypted TLS channels on Cloudflare edge networks.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">5. Contact Us</h2>
          <p>
            If you have questions about your personal data or wish to request data deletion, contact us at{' '}
            <span className="text-cyan-400">support@boardly.cfd</span>.
          </p>
        </section>
      </GlassCard>
    </div>
  );
}

export default PrivacyPage;

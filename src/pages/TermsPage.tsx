import { GlassCard } from '../components/ui/GlassCard';
import { Badge } from '../components/ui/Badge';

export function TermsPage() {
  return (
    <div className="site-container pt-28 pb-20 max-w-4xl page-enter space-y-8">
      <div className="space-y-3">
        <Badge color="violet">Legal</Badge>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">
          Terms of Service
        </h1>
        <p className="text-sm text-[var(--text-faint)]">Last updated: October 2026</p>
      </div>

      <GlassCard className="p-8 space-y-6 text-sm text-[var(--text-muted)] leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">1. Acceptance of Terms</h2>
          <p>
            By creating an account or accessing the Boardly website, you agree to comply with and be bound by these Terms of Service. If you disagree with any portion of these terms, you should discontinue using the platform immediately.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">2. Educational Disclaimer</h2>
          <p>
            Boardly is an independent educational test-preparation platform. Boardly is not affiliated with, endorsed by, or operated by FAST-NUCES, NUST, GIKI, LUMS, NED University, PMDC, or any university admissions testing authority. All aggregate estimators and historical closing marks are for guidance purposes only.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">3. User Conduct &amp; Academic Integrity</h2>
          <p>
            Users are strictly prohibited from attempting to scrape question banks, reverse-engineer proprietary algorithms, automate test submissions, or circulate unauthorized test answer keys. Violation of these policies will result in immediate permanent account suspension.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">4. Subscriptions &amp; Payments</h2>
          <p>
            Pro subscriptions are billed monthly at the stated rate (PKR 199/month). Manual local payments (JazzCash / EasyPaisa / SadaPay) require submission of a valid transaction screenshot for verification.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">5. Modifications</h2>
          <p>
            We reserve the right to modify these terms at any time. Continued use of Boardly following published updates constitutes your acceptance of the revised terms.
          </p>
        </section>
      </GlassCard>
    </div>
  );
}

export default TermsPage;

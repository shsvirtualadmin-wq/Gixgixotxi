import React from 'react';
import { Scale, FileCheck, AlertTriangle, ArrowLeft, Mail } from 'lucide-react';
import { MarketingPage } from './Navbar';

interface TermsOfServicePageProps {
  onNavigate: (page: MarketingPage) => void;
}

export const TermsOfServicePage: React.FC<TermsOfServicePageProps> = ({ onNavigate }) => {
  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 max-w-4xl mx-auto space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <button
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
          <Scale className="w-3.5 h-3.5" />
          <span>Legal Agreement</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-[#0A1330] font-poppins tracking-tight">
          Terms of Service
        </h1>
        <p className="text-sm font-semibold text-slate-500">
          Last updated: October 10, 2026 · Effective immediately for all registered users
        </p>
      </div>

      {/* Main Content */}
      <div className="p-8 sm:p-12 rounded-[28px] bg-white border border-slate-200/80 shadow-lg shadow-slate-900/5 space-y-10 text-slate-700 text-sm sm:text-base leading-relaxed">
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold font-poppins text-[#0A1330]">
            1. Agreement to Terms
          </h2>
          <p>
            By accessing or using Boardly (accessible via web browsers, tablets, and mobile web clients), you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree with any provision of these terms, you must refrain from creating an account or using our testing platform.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold font-poppins text-[#0A1330]">
            2. Account Registration & Single-User Policy
          </h2>
          <p>
            You must provide accurate, current, and complete registration information. Each Boardly student account is licensed exclusively for personal, individual academic preparation. Account sharing, credential reselling, or simultaneous multi-device logins to circumvent subscription limits is strictly prohibited. You are responsible for safeguarding your login password.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold font-poppins text-[#0A1330]">
            3. Acceptable Use & Academic Integrity
          </h2>
          <p>
            When utilizing Boardly, you agree that you will not:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-600">
            <li>Scrape, extract, copy, or spider question banks, diagrams, or derivations via automated bots or crawlers.</li>
            <li>Redistribute, commercially resell, or republish Boardly question compilations and PDF mock examinations without explicit written permission.</li>
            <li>Attempt to reverse-engineer, decompile, or tamper with the diagnostic scoring algorithms, Ustaad AI endpoints, or server infrastructure.</li>
            <li>Engage in abusive, defamatory, or disruptive conduct in community events, live Boardly Blitz chat, or student forums.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold font-poppins text-[#0A1330]">
            4. Subscriptions, Payments & Strict No-Refunds Policy
          </h2>
          <p>
            Boardly offers both free and paid subscription packages (Pro and Premium) priced in Pakistani Rupees (PKR) for durations of Monthly, 3 Months, 8 Months, and 12 Months.
          </p>
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-950 text-sm space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Strict No-Refunds Policy on Digital Memberships</span>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed text-amber-900">
              Because full access to our digital question banks, downloadable PDF tests, and instant AI query allocations is unlocked immediately upon subscription activation, all Pro and Premium purchases are strictly non-refundable once payment is completed and verified.
            </p>
            <p className="text-xs sm:text-sm text-amber-900">
              Students are strongly encouraged to test the comprehensive Free tier first to confirm that the question formatting and subject coverage match their academic needs before committing to a paid plan.
            </p>
          </div>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold font-poppins text-[#0A1330]">
            5. Intellectual Property
          </h2>
          <p>
            All text explanations, formula derivations, visual diagrams, test user interfaces, trademarks, brand marks, and software code on Boardly are the exclusive intellectual property of Boardly and its educational partners. No license or title to our software or content is transferred to you except for the limited personal study access permitted under your subscription.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold font-poppins text-[#0A1330]">
            6. Account Suspension & Termination
          </h2>
          <p>
            We reserve the right to suspend, throttle, or terminate any account found in breach of our Acceptable Use policy, single-user restrictions, or fair-play regulations without prior notice or refund. If your account is terminated due to violation, you forfeit all active subscription durations.
          </p>
        </section>

        {/* Section 7 */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold font-poppins text-[#0A1330]">
            7. Disclaimers & Academic Limitation of Liability
          </h2>
          <p>
            Boardly is an independent diagnostic testing tool and practice aid. While our curriculum team makes every effort to ensure questions mirror the latest board syllabi, Boardly is not officially affiliated with or endorsed by any government intermediate board (FBISE, BISE), the Pakistan Medical and Dental Council (PMDC), or university testing authorities. We do not guarantee specific minimum scores or admissions outcomes.
          </p>
        </section>

        {/* Section 8: Contact */}
        <section className="space-y-3 p-6 rounded-2xl bg-indigo-50/70 border border-indigo-200/60">
          <h2 className="text-lg font-bold font-poppins text-[#0A1330] flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-600" />
            <span>8. Contact & Legal Administration</span>
          </h2>
          <p className="text-sm text-slate-700">
            For contractual inquiries, student institutional licensing, or terms clarification, please contact:
          </p>
          <div className="text-sm font-semibold text-indigo-900 pt-1">
            <p>Boardly Legal & Operations</p>
            <p>Email: <a href="mailto:support@boardly.cfd" className="underline hover:text-indigo-700">support@boardly.cfd</a></p>
            <p>Official Administrator: <a href="mailto:shsvirtualadmin@gmail.com" className="underline hover:text-indigo-700">shsvirtualadmin@gmail.com</a></p>
          </div>
        </section>
      </div>
    </div>
  );
};

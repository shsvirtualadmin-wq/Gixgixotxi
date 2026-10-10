import React from 'react';
import { Shield, Lock, FileText, Mail, ArrowLeft } from 'lucide-react';
import { MarketingPage } from './Navbar';

interface PrivacyPolicyPageProps {
  onNavigate: (page: MarketingPage) => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onNavigate }) => {
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
          <Shield className="w-3.5 h-3.5" />
          <span>Legal & Transparency</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-[#0A1330] font-poppins tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-sm font-semibold text-slate-500">
          Last updated: October 10, 2026 · Effective immediately for all Boardly users
        </p>
      </div>

      {/* Main Legal Content Container */}
      <div className="p-8 sm:p-12 rounded-[28px] bg-white border border-slate-200/80 shadow-lg shadow-slate-900/5 space-y-10 text-slate-700 text-sm sm:text-base leading-relaxed">
        {/* Section 1: Introduction */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold font-poppins text-[#0A1330]">
            1. Overview & Commitment
          </h2>
          <p>
            Boardly ("we", "us", or "our") is dedicated to protecting the privacy and personal data of students, parents, and educators who use our online testing portal and academic services. This Privacy Policy outlines what information we collect, how it is used to deliver diagnostic testing and personalized recommendations, and your rights regarding your personal records.
          </p>
          <p>
            We do not sell, rent, or monetize your personal data or study history to advertisers or third-party marketing brokers.
          </p>
        </section>

        {/* Section 2: Data Collected */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold font-poppins text-[#0A1330]">
            2. Information We Collect
          </h2>
          <p>
            When you interact with the Boardly platform, we collect information in the following ways:
          </p>
          <div className="space-y-3 pl-2">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm mb-1">Account & Profile Information</h3>
              <p className="text-xs sm:text-sm text-slate-600">
                Your full name, email address, password hash, phone or WhatsApp contact (if provided), target board (e.g., FBISE, BISE Lahore), current grade/class, and academic track (Pre-Medical, Pre-Engineering, ICS, General Science).
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm mb-1">Academic & Practice Logs</h3>
              <p className="text-xs sm:text-sm text-slate-600">
                Questions attempted, selected options, elapsed test time, correct vs. incorrect counts, bookmark records, test completion timestamps, and diagnostic weak-area tags used to calibrate your personalized practice sets.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm mb-1">Payment Verification Data</h3>
              <p className="text-xs sm:text-sm text-slate-600">
                When subscribing to Pro or Premium, we record your chosen payment method (JazzCash, Easypaisa, Sadapay, bank transfer), transaction ID, and uploaded transfer screenshots for administrative manual verification. We never store credit card CVVs or bank login credentials on our servers.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Cookies & Local Storage */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold font-poppins text-[#0A1330]">
            3. Cookies & Browser Local Storage
          </h2>
          <p>
            Boardly utilizes standard browser cookies and local storage tokens strictly for essential functionality:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600">
            <li>
              <strong>Session Authentication:</strong> Remembering your logged-in session so you do not need to enter credentials on every page refresh.
            </li>
            <li>
              <strong>Active Exam Persistence:</strong> Automatically saving in-progress mock tests in local browser storage so accidental disconnects do not wipe your answers.
            </li>
            <li>
              <strong>Diagnostic Preferences:</strong> Remembering your selected class, target university, and subject preferences across visits.
            </li>
          </ul>
        </section>

        {/* Section 4: Use of Data */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold font-poppins text-[#0A1330]">
            4. How We Use Your Data
          </h2>
          <p>
            We process your information exclusively for academic service delivery:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-600">
            <li>Generating chapter-level diagnostic analytics and predictive board score estimates.</li>
            <li>Providing contextual tutoring via Boardy, your 24/7 study buddy.</li>
            <li>Enforcing fair play and preventing multiple simultaneous logins on shared accounts.</li>
            <li>Sending critical account notifications, subscription renewal notices, and event confirmations (such as Boardly Blitz schedules).</li>
          </ul>
        </section>

        {/* Section 5: Data Security */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold font-poppins text-[#0A1330]">
            5. Data Protection & Security
          </h2>
          <p>
            All network communication with Boardly is secured via TLS/SSL encryption (HTTPS). User records and test archives are stored in access-controlled cloud databases protected by Row-Level Security (RLS) policies. Only authenticated system administrators with two-factor verification have access to payment verification and customer support consoles.
          </p>
        </section>

        {/* Section 6: Data Retention & Deletion */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold font-poppins text-[#0A1330]">
            6. Your Rights & Account Deletion
          </h2>
          <p>
            You retain full ownership of your personal data. At any time, you have the right to:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-600">
            <li>Review and update your profile details directly from the student dashboard.</li>
            <li>Clear your historical test attempts and diagnostic logs.</li>
            <li>Request permanent, irrevocable deletion of your account and all associated test records by emailing our privacy team.</li>
          </ul>
        </section>

        {/* Section 7: Contact */}
        <section className="space-y-3 p-6 rounded-2xl bg-indigo-50/70 border border-indigo-200/60">
          <h2 className="text-lg font-bold font-poppins text-[#0A1330] flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-600" />
            <span>7. Privacy Inquiries & Support</span>
          </h2>
          <p className="text-sm text-slate-700">
            If you have questions, feedback, or requests regarding this Privacy Policy or your personal records, please reach out to:
          </p>
          <div className="text-sm font-semibold text-indigo-900 pt-1">
            <p>Boardly Privacy & Academic Compliance</p>
            <p>Email: <a href="mailto:support@boardly.cfd" className="underline hover:text-indigo-700">support@boardly.cfd</a></p>
            <p>Official Administrator: <a href="mailto:shsvirtualadmin@gmail.com" className="underline hover:text-indigo-700">shsvirtualadmin@gmail.com</a></p>
          </div>
        </section>
      </div>
    </div>
  );
};

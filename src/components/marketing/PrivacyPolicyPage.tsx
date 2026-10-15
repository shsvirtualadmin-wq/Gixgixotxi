import React from 'react';
import { Shield, Lock, FileText, Mail, ArrowLeft } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export const PrivacyPolicyPage: React.FC = () => {
  const handleBack = () => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 max-w-4xl mx-auto space-y-10 text-left">
      {/* Header */}
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          className="text-xs"
        >
          Back to Home
        </Button>

        <Badge variant="brand">Legal & Transparency</Badge>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#EAF0FF] font-['Oblata_Display',sans-serif] tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-xs sm:text-sm font-semibold text-[#A3B0CC]">
          Last updated: October 2026 · Effective for all Boardly students and members
        </p>
      </div>

      {/* Main Legal Content Container */}
      <Card variant="hero" className="p-8 sm:p-12 space-y-8 text-sm sm:text-base leading-relaxed text-[#A3B0CC]">
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold text-[#EAF0FF] font-['Oblata_Display',sans-serif]">
            1. Overview & Commitment
          </h2>
          <p>
            Boardly (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is dedicated to protecting the privacy and personal data of students, parents, and educators who use our online testing portal and academic services. This Privacy Policy outlines what information we collect, how it is used to deliver diagnostic testing and personalized recommendations, and your rights regarding your personal records.
          </p>
          <p>
            We do not sell, rent, or monetize your personal data or study history to advertisers or third-party marketing brokers.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold text-[#EAF0FF] font-['Oblata_Display',sans-serif]">
            2. Information We Collect
          </h2>
          <p>
            When you interact with the Boardly platform, we collect information in the following ways:
          </p>
          <div className="space-y-3 pl-2">
            <div className="p-4 rounded-2xl bg-white/4 border border-white/8">
              <h3 className="font-bold text-[#EAF0FF] text-sm mb-1">Account & Profile Information</h3>
              <p className="text-xs sm:text-sm text-[#A3B0CC]">
                When you create an account or sign in with Google OAuth, we receive your email address, display name, and profile picture URL. During academic onboarding, you may specify your target university (FAST, NUST, MDCAT, etc.), grade, and weak subjects.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white/4 border border-white/8">
              <h3 className="font-bold text-[#EAF0FF] text-sm mb-1">Testing & Performance Data</h3>
              <p className="text-xs sm:text-sm text-[#A3B0CC]">
                We store the questions you attempt, selected answers, time spent per MCQ, test completion timestamps, and aggregate score calculations to generate your personalized weakness radar.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white/4 border border-white/8">
              <h3 className="font-bold text-[#EAF0FF] text-sm mb-1">Payment Proof Documentation</h3>
              <p className="text-xs sm:text-sm text-[#A3B0CC]">
                For manual bank, JazzCash, or EasyPaisa upgrades, students submit transaction reference numbers or deposit slip images. These documents are stored securely in encrypted cloud storage solely for manual auditing.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold text-[#EAF0FF] font-['Oblata_Display',sans-serif]">
            3. Data Security & Storage
          </h2>
          <p>
            Your account credentials and test data are secured using industry-standard Firebase Authentication and Google Cloud Firestore infrastructure with strict security rules enforcing least-privilege document access.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold text-[#EAF0FF] font-['Oblata_Display',sans-serif]">
            4. Contact Our Data Protection Officer
          </h2>
          <p>
            If you have questions about your personal records or wish to request data deletion, contact us directly at:
          </p>
          <div className="p-4 rounded-2xl bg-white/6 border border-white/10 flex items-center gap-3">
            <Mail className="w-5 h-5 text-[#22D3EE]" />
            <a href="mailto:support@boardly.cfd" className="font-bold text-[#22D3EE] hover:underline">
              support@boardly.cfd
            </a>
          </div>
        </section>
      </Card>
    </div>
  );
};

export default PrivacyPolicyPage;

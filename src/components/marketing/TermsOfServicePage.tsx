import React from 'react';
import { Scale, FileCheck, AlertTriangle, ArrowLeft, Mail } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export const TermsOfServicePage: React.FC = () => {
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

        <Badge variant="brand">Legal Agreement</Badge>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#EAF0FF] font-['Oblata_Display',sans-serif] tracking-tight">
          Terms of Service
        </h1>
        <p className="text-xs sm:text-sm font-semibold text-[#A3B0CC]">
          Last updated: October 2026 · Effective immediately for all registered Boardly members
        </p>
      </div>

      {/* Main Content */}
      <Card variant="hero" className="p-8 sm:p-12 space-y-8 text-sm sm:text-base leading-relaxed text-[#A3B0CC]">
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold text-[#EAF0FF] font-['Oblata_Display',sans-serif]">
            1. Agreement to Terms
          </h2>
          <p>
            By accessing or using Boardly (accessible via boardly.cfd across browsers, tablets, and mobile clients), you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree with any provision, you must refrain from registering an account or accessing our testing platform.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold text-[#EAF0FF] font-['Oblata_Display',sans-serif]">
            2. Account Registration & Single-User Policy
          </h2>
          <p>
            You must provide accurate and verifiable account information. Each Boardly student account is licensed exclusively for individual academic preparation. Account credential sharing, scraping, reselling, or concurrent multi-user access to bypass daily limits is strictly prohibited and subject to account suspension.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold text-[#EAF0FF] font-['Oblata_Display',sans-serif]">
            3. Digital Purchases & Strict No-Refund Policy
          </h2>
          <p>
            Boardly Pro (PKR 199/month or seasonal bundles) is an instant digital learning membership. Because activating a Pro membership immediately grants access to our full question vault, past papers archive, and computational AI servers:
          </p>
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs sm:text-sm text-[#FBBF24]">
            <strong>Important Notice:</strong> All digital upgrade purchases made via bank transfer, JazzCash, or EasyPaisa are final and non-refundable once the membership status is activated.
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold text-[#EAF0FF] font-['Oblata_Display',sans-serif]">
            4. Academic Integrity & Intellectual Property
          </h2>
          <p>
            All question stems, diagrams, derivations, and AI algorithms are protected by copyright. Automated extraction, web crawling, or redistribution of Boardly question banks without prior written consent from SHS Virtual Academy is strictly forbidden.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold text-[#EAF0FF] font-['Oblata_Display',sans-serif]">
            5. Contact Information
          </h2>
          <p>
            For legal notices, billing inquiries, or compliance questions, reach our administration at:
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

export default TermsOfServicePage;

import React, { useState } from 'react';
import {
  Check,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Smartphone,
  Building,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

export const PricingPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleRoute = (route: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', route);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const comparisonRows = [
    { feature: 'Daily Practice Sprints', free: '3 Sprints / day', pro: 'Unlimited' },
    { feature: 'Boardy AI Questions', free: '10 queries / day', pro: '100 queries / day' },
    { feature: 'KaTeX Step-by-Step Derivations', free: true, pro: true },
    { feature: 'Full Question Vault (17k+ MCQs)', free: 'Core Chapters', pro: 'All Chapters & Difficulty' },
    { feature: 'Past Papers Archive', free: false, pro: 'Full Archive (FAST, NUST, MDCAT)' },
    { feature: 'Sunday Live Arena Mocks', free: false, pro: true },
    { feature: 'Universal Merit Meter Calculator', free: true, pro: true },
    { feature: 'Negative Marking Analysis', free: true, pro: true },
    { feature: 'Diagnostic Weakness Radar', free: 'Basic', pro: 'Deep Chapter Map' },
    { feature: 'Priority Support', free: false, pro: true },
  ];

  const pricingFaqs = [
    {
      q: 'How do I pay with JazzCash or EasyPaisa?',
      a: 'Go to your account portal under "Plans & Upgrades". Select Pro (PKR 199), transfer the amount to our official Boardly account number, and upload your payment transaction screenshot or TID. Your account is verified and upgraded promptly.',
    },
    {
      q: 'Is there a refund policy?',
      a: 'As stated in our Terms of Service, all digital study memberships grant immediate access to proprietary question databases and are strictly non-refundable once activated.',
    },
    {
      q: 'Does the subscription auto-renew or charge my card automatically?',
      a: 'No. We do not store or auto-debit your bank card. Every renewal is manual and under your complete control through bank transfer or mobile wallets.',
    },
    {
      q: 'Can I use one account across multiple devices?',
      a: 'Yes, your Boardly login works seamlessly across desktop browsers, laptops, tablets, and smartphones with real-time test progress sync.',
    },
  ];

  return (
    <div className="w-full flex flex-col items-center pt-24 sm:pt-28 pb-16 px-4 sm:px-6">
      {/* Header */}
      <div className="max-w-3xl text-center mb-16">
        <Badge variant="brand" className="mb-3">
          Transparent Membership
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-[#EAF0FF] font-['Oblata_Display',sans-serif] tracking-tight">
          Invest in Your Merit, Not High Academy Fees
        </h1>
        <p className="mt-4 text-base text-[#A3B0CC] leading-relaxed">
          Full digital access to Pakistani entrance test prep for just PKR 199/month. No hidden charges, no auto-billing surprises.
        </p>
      </div>

      {/* Main Pricing Cards */}
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 text-left mb-20">
        {/* Free Plan */}
        <Card variant="default" className="p-8 sm:p-10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#A3B0CC]">
                Free Starter
              </span>
              <Badge variant="neutral" size="sm">
                No Credit Card
              </Badge>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-extrabold text-[#EAF0FF] tabular-nums font-['Oblata_Display',sans-serif]">
                PKR 0
              </span>
              <span className="text-xs text-[#A3B0CC]">/ forever</span>
            </div>

            <p className="text-sm text-[#A3B0CC] mt-3 leading-relaxed">
              Perfect for quick self-assessment and trying out the KaTeX study cockpit before exam season.
            </p>

            <div className="mt-8 pt-8 border-t border-white/8 space-y-3.5 text-sm text-[#EAF0FF]">
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-[#34D399] shrink-0" />
                <span>3 Practice Sprints per day</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-[#34D399] shrink-0" />
                <span>10 Boardy AI queries per day</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-[#34D399] shrink-0" />
                <span>Step-by-step formula derivations</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-[#34D399] shrink-0" />
                <span>Pakistani Universities Merit Meter</span>
              </div>
              <div className="flex items-center gap-3 text-[#6F7C99]">
                <X className="w-4 h-4 shrink-0" />
                <span className="line-through">Full-length past paper mocks</span>
              </div>
              <div className="flex items-center gap-3 text-[#6F7C99]">
                <X className="w-4 h-4 shrink-0" />
                <span className="line-through">Sunday Live Arena mocks</span>
              </div>
            </div>
          </div>

          <Button
            variant="secondary"
            size="lg"
            onClick={() => handleRoute('/signup')}
            className="mt-10 w-full"
          >
            Start Free
          </Button>
        </Card>

        {/* Pro Plan - Highlighted with animated gradient border */}
        <div className="animated-border-card">
          <div className="inner-content p-8 sm:p-10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#22D3EE]">
                  Boardly Pro Pass
                </span>
                <span className="px-3 py-1 rounded-full bg-[#2F6BFF]/25 text-[#22D3EE] text-xs font-bold border border-[#22D3EE]/30 shadow-[0_0_12px_rgba(34,211,238,0.3)]">
                  Most Popular
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-extrabold text-[#EAF0FF] tabular-nums font-['Oblata_Display',sans-serif]">
                  PKR 199
                </span>
                <span className="text-xs text-[#A3B0CC]">/ month</span>
              </div>

              <p className="text-sm text-[#A3B0CC] mt-3 leading-relaxed">
                Full unrestricted test engine access. Cheaper than a single photocopy booklet from physical academies.
              </p>

              <div className="mt-8 pt-8 border-t border-white/8 space-y-3.5 text-sm text-[#EAF0FF]">
                <div className="flex items-center gap-3 font-semibold text-[#22D3EE]">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Unlimited Daily Practice Sprints</span>
                </div>
                <div className="flex items-center gap-3 font-semibold text-[#22D3EE]">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>100 Boardy AI queries per day</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-[#22D3EE] shrink-0" />
                  <span>Complete Past Papers Vault (FAST, NET, MDCAT)</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-[#22D3EE] shrink-0" />
                  <span>Sunday National Arena Mock Registrations</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-[#22D3EE] shrink-0" />
                  <span>Deep Chapter-Level Weakness Radar</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-[#22D3EE] shrink-0" />
                  <span>Local manual slip upload: JazzCash / EasyPaisa</span>
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={() => handleRoute('/signup')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="mt-10 w-full"
            >
              Get Boardly Pro (PKR 199)
            </Button>
          </div>
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="max-w-4xl w-full text-left mb-20">
        <h3 className="text-2xl font-bold text-[#EAF0FF] font-['Oblata_Display',sans-serif] mb-6 text-center">
          Compare Plan Features
        </h3>

        <div className="overflow-x-auto rounded-[24px] border border-white/12 bg-white/4 backdrop-blur-xl">
          <table className="w-full text-sm text-left text-[#EAF0FF]">
            <thead>
              <tr className="border-b border-white/10 bg-[#0E1626]/80 text-xs uppercase tracking-wider text-[#A3B0CC]">
                <th className="py-4 px-6 font-bold">Feature</th>
                <th className="py-4 px-6 font-bold text-center">Free Starter</th>
                <th className="py-4 px-6 font-bold text-center text-[#22D3EE]">Boardly Pro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/6">
              {comparisonRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-white/4 transition-colors">
                  <td className="py-4 px-6 font-medium text-[#EAF0FF]">{row.feature}</td>
                  <td className="py-4 px-6 text-center text-[#A3B0CC]">
                    {typeof row.free === 'boolean' ? (
                      row.free ? (
                        <Check className="w-4 h-4 text-[#34D399] mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-[#6F7C99] mx-auto" />
                      )
                    ) : (
                      row.free
                    )}
                  </td>
                  <td className="py-4 px-6 text-center font-semibold text-[#22D3EE]">
                    {typeof row.pro === 'boolean' ? (
                      row.pro ? (
                        <Check className="w-4 h-4 text-[#22D3EE] mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-[#6F7C99] mx-auto" />
                      )
                    ) : (
                      row.pro
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Local Payment Methods Info */}
      <div className="max-w-4xl w-full p-8 rounded-[24px] bg-white/4 border border-white/10 backdrop-blur-xl text-left mb-20">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="w-6 h-6 text-[#22D3EE]" />
          <h4 className="text-lg font-bold text-[#EAF0FF]">
            Convenient Local Pakistani Payment Methods
          </h4>
        </div>
        <p className="text-xs sm:text-sm text-[#A3B0CC] leading-relaxed">
          Upgrade securely without international credit cards. We accept manual payment proof slips via:
        </p>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/8 flex items-center gap-2.5">
            <Smartphone className="w-4 h-4 text-orange-400" />
            <span className="font-semibold text-[#EAF0FF]">JazzCash Mobile Account</span>
          </div>
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/8 flex items-center gap-2.5">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-[#EAF0FF]">EasyPaisa Wallet</span>
          </div>
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/8 flex items-center gap-2.5">
            <Building className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-[#EAF0FF]">Online Bank Transfer / IBFT</span>
          </div>
        </div>
      </div>

      {/* Pricing FAQs */}
      <div className="max-w-3xl w-full text-left">
        <h3 className="text-2xl font-bold text-[#EAF0FF] font-['Oblata_Display',sans-serif] mb-6 text-center">
          Pricing & Membership FAQs
        </h3>
        <div className="space-y-3">
          {pricingFaqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="rounded-2xl border border-white/10 bg-white/4 backdrop-blur-md overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="font-bold text-sm sm:text-base text-[#EAF0FF]">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#A3B0CC] shrink-0 transition-transform ${
                      isOpen ? 'rotate-180 text-[#22D3EE]' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-[#A3B0CC] leading-relaxed border-t border-white/6 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PricingPage;

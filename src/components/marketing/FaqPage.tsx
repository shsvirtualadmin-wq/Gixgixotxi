import React, { useState, useMemo } from 'react';
import { HelpCircle, Search, Sparkles, BookOpen, CreditCard, Shield, ArrowRight } from 'lucide-react';
import { PRICING_FAQS, FaqItem } from '../../data/marketingPricingData';
import { MarketingPage } from './Navbar';

const EXTENDED_FAQS: FaqItem[] = [
  ...PRICING_FAQS,
  {
    id: 'mobile-app',
    category: 'Platform & Devices',
    question: 'Can I use Boardly on my mobile phone, tablet, or laptop?',
    answer:
      'Yes, Boardly is built with a responsive, mobile-first design. It works smoothly on any modern smartphone browser, iPad/tablet, and desktop without requiring a large app store download. Your test progress and question bookmarks synchronize instantly across all your devices.',
  },
  {
    id: 'curriculum-boards',
    category: 'Curriculum & Content',
    question: 'Which educational boards and entrance tests are supported?',
    answer:
      'Boardly supports all major Pakistani boards: Federal Board (FBISE), Punjab Boards (Lahore, Rawalpindi, Faisalabad, Gujranwala, Multan), Sindh Boards (Karachi, Hyderabad), KPK Boards (Peshawar, Abbottabad), and Balochistan (Quetta). For university admissions, we include dedicated modules for PMDC MDCAT, UET Taxila TCAT, NUST NET, FAST-NUCES, and GIKI.',
  },
  {
    id: 'ai-queries-accuracy',
    category: 'Ustaad AI',
    question: 'How accurate is Ustaad AI with complex numericals?',
    answer:
      'Ustaad AI is specifically trained on Pakistani board textbooks and physics/chemistry equations. Rather than simply giving you an answer, it breaks problems down into standard units (SI), identifies relevant formulas, and explains why a specific method is applied so you learn the underlying derivation.',
  },
  {
    id: 'offline-pdf',
    category: 'Downloads & Mocks',
    question: 'How do the printable PDF test papers work?',
    answer:
      'Premium members can generate custom or full-length past paper test sets and download clean PDF booklets. Each download includes a printable question booklet, an official OMR bubble sheet for shading practice, and a separate answer key with full derivations.',
  },
];

interface FaqPageProps {
  onNavigate: (page: MarketingPage) => void;
  onGetStarted: () => void;
}

export const FaqPage: React.FC<FaqPageProps> = ({ onNavigate, onGetStarted }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [openId, setOpenId] = useState<string | null>(EXTENDED_FAQS[0]?.id || null);

  const categories = ['All', 'Pricing & Plans', 'Curriculum & Content', 'Ustaad AI', 'Platform & Devices'];

  const filteredFaqs = useMemo(() => {
    return EXTENDED_FAQS.filter((faq) => {
      const matchesSearch =
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (selectedCategory === 'All') return true;
      if (selectedCategory === 'Pricing & Plans') {
        return faq.id.includes('plan') || faq.id.includes('free') || faq.id.includes('pay') || faq.id.includes('discount') || faq.id.includes('sub');
      }
      return faq.category === selectedCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 max-w-4xl mx-auto space-y-12">
      {/* Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold">
          <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
          <span>Knowledge Base & Support</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-[#0A1330] font-poppins tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Find instant answers to questions regarding our question banks, plans, AI tutor, and payment options in Pakistan.
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="relative max-w-xl mx-auto">
        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by topic, e.g. 'MDCAT', 'JazzCash', 'PDF', 'AI'..."
          className="w-full pl-12 pr-4 py-3.5 rounded-full bg-white border border-slate-200/80 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
        />
      </div>

      {/* Categories Segmented Filter */}
      <div className="flex justify-center overflow-x-auto pb-2">
        <div className="inline-flex gap-1.5 p-1.5 rounded-full bg-slate-200/60 border border-slate-200/70 max-w-full">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* FAQs List */}
      <div className="space-y-3.5">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12 p-6 rounded-2xl bg-white border border-slate-200/70 text-slate-500 text-sm">
            No questions found matching your search. Try another query or reach out to our team directly.
          </div>
        ) : (
          filteredFaqs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className={`rounded-[22px] transition-all duration-200 border bg-white ${
                  isOpen
                    ? 'border-indigo-300 shadow-md shadow-indigo-900/5'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <button
                  onClick={() => setOpenId(isOpen ? null : faq.id)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-[22px]"
                  aria-expanded={isOpen}
                >
                  <span className="text-base sm:text-lg font-bold text-[#0A1330]">
                    {faq.question}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen
                        ? 'bg-indigo-600 text-white rotate-45'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span className="text-lg font-semibold leading-none">+</span>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-1 text-sm sm:text-base text-slate-600 leading-relaxed border-t border-slate-100">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Still Need Help Box */}
      <div className="p-8 rounded-[28px] bg-gradient-to-r from-indigo-50 via-slate-50 to-indigo-50 border border-indigo-200/70 text-center space-y-4">
        <h3 className="text-xl font-bold font-poppins text-[#0A1330]">
          Still have an unanswered question?
        </h3>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Our Lahore & Islamabad academic support desks are here to assist with syllabus queries, custom bundles, or verification.
        </p>
        <button
          onClick={() => onNavigate('contact')}
          className="px-6 py-3 rounded-full text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md inline-flex items-center gap-2 cursor-pointer"
        >
          <span>Contact Academic Support</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

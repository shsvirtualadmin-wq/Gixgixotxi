import React, { useState, useMemo, useEffect } from 'react';
import { Star, ShieldCheck, Quote, Filter, Search, PlusCircle, X, ChevronRight } from 'lucide-react';
import { REAL_STUDENT_REVIEWS, StudentReviewItem } from '../../data/studentReviews';
import { UniversityLogoBadge } from '../UniversityLogoBadge';
import { UNIVERSITIES } from '../../data/universities';
import { SubmitReviewModal } from './SubmitReviewModal';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface ReviewsWallProps {
  onOpenSubmitModal?: () => void;
  onOpenFullModal?: () => void;
  isFullPage?: boolean;
}

export const ReviewsWall: React.FC<ReviewsWallProps> = ({
  onOpenSubmitModal,
  isFullPage = false,
}) => {
  const [reviewsList, setReviewsList] = useState<StudentReviewItem[]>(REAL_STUDENT_REVIEWS);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [fullGridModalOpen, setFullGridModalOpen] = useState(isFullPage);

  // Filters for the full grid view
  const [selectedUni, setSelectedUni] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRating, setSelectedRating] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch approved community reviews from Firestore on mount
  useEffect(() => {
    async function loadCommunityReviews() {
      try {
        const q = query(collection(db, 'reviews'), where('approved', '==', true));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const fetched: StudentReviewItem[] = snap.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              name: data.name || 'Student',
              universityId: data.universityId || 'nust',
              universityName: data.universityName || 'University',
              testType: data.testType || 'Entrance Test',
              scoreOrAggregate: data.scoreOrAggregate || 'Verified Score',
              rating: data.rating || 5,
              quote: data.quote || '',
              verified: Boolean(data.verified),
              date: data.date || 'Recent',
              approved: true,
            };
          });

          // Merge: Community approved first, then curated base reviews (avoid duplicates)
          const merged = [...fetched, ...REAL_STUDENT_REVIEWS.filter(r => !fetched.some(f => f.id === r.id))];
          setReviewsList(merged);
        }
      } catch (err) {
        console.warn('Live reviews fetch fallback:', err);
      }
    }
    loadCommunityReviews();
  }, []);

  // Filtered list for the modal grid
  const filteredReviews = useMemo(() => {
    return reviewsList.filter((rev) => {
      if (selectedUni !== 'all' && rev.universityId !== selectedUni) return false;
      if (selectedCategory !== 'all') {
        const catLower = selectedCategory.toLowerCase();
        const testLower = rev.testType.toLowerCase();
        if (catLower === 'engineering' && !testLower.includes('net') && !testLower.includes('ecat') && !testLower.includes('giki') && !testLower.includes('pieas')) return false;
        if (catLower === 'medical' && !testLower.includes('mdcat') && !testLower.includes('nums')) return false;
        if (catLower === 'cs' && !testLower.includes('fast') && !testLower.includes('cs') && !testLower.includes('software')) return false;
        if (catLower === 'business' && !testLower.includes('iba') && !testLower.includes('lums')) return false;
      }
      if (selectedRating !== 'all' && rev.rating !== selectedRating) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = rev.name.toLowerCase().includes(q);
        const matchesUni = rev.universityName.toLowerCase().includes(q);
        const matchesTest = rev.testType.toLowerCase().includes(q);
        const matchesQuote = rev.quote.toLowerCase().includes(q);
        if (!matchesName && !matchesUni && !matchesTest && !matchesQuote) return false;
      }
      return true;
    });
  }, [reviewsList, selectedUni, selectedCategory, selectedRating, searchQuery]);

  // Two rows for infinite horizontal ticker
  const rowOne = useMemo(() => reviewsList.slice(0, Math.ceil(reviewsList.length / 2)), [reviewsList]);
  const rowTwo = useMemo(() => reviewsList.slice(Math.ceil(reviewsList.length / 2)), [reviewsList]);

  // Triple the arrays for seamless loop
  const tickerRowOne = useMemo(() => [...rowOne, ...rowOne, ...rowOne], [rowOne]);
  const tickerRowTwo = useMemo(() => [...rowTwo, ...rowTwo, ...rowTwo], [rowTwo]);

  const renderReviewCard = (rev: StudentReviewItem, key: string, isTicker = true) => (
    <div
      key={key}
      className={`glass-floating-card rounded-2xl p-5 border border-white/60 shadow-md flex flex-col justify-between transition-transform duration-200 hover:-translate-y-1 ${
        isTicker ? 'w-[320px] sm:w-[360px] shrink-0' : 'w-full'
      }`}
    >
      <div>
        {/* Top Header: University Logo, Test Type, and Star Rating */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <UniversityLogoBadge university={rev.universityId} size="sm" />
            <div>
              <div className="text-xs font-bold text-slate-900 leading-tight">
                {rev.universityName}
              </div>
              <div className="text-[11px] font-semibold text-indigo-600">
                {rev.testType}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-0.5 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-[11px] font-black text-amber-800">{rev.rating}.0</span>
          </div>
        </div>

        {/* Testimonial Quote */}
        <div className="relative mb-3">
          <Quote className="w-4 h-4 text-indigo-400/40 inline-block mr-1 align-top" />
          <p className="text-xs text-slate-700 leading-relaxed font-normal inline">
            "{rev.quote}"
          </p>
        </div>
      </div>

      {/* Footer: Student Name, Verified Badge, Score or Aggregate */}
      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-900">{rev.name}</span>
          {rev.verified && (
            <span
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-700 border border-emerald-200/80"
              title="Verified Student Prep"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Verified
            </span>
          )}
        </div>
        <div className="font-extrabold text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded-md text-[11px]">
          {rev.scoreOrAggregate}
        </div>
      </div>
    </div>
  );

  return (
    <section className="relative py-12 sm:py-20 overflow-hidden">
      {/* Section Header */}
      <div className="px-4 sm:px-6 max-w-6xl mx-auto mb-8 sm:mb-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200/60">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Real Verified Student Reviews</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0A1330] font-poppins">
              Loved by students entering top universities
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Read authentic feedback from aspirants who practiced with Boardly and secured admissions in NUST, FAST, MDCAT, GIKI, IBA, and more.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => (onOpenSubmitModal ? onOpenSubmitModal() : setSubmitModalOpen(true))}
              className="px-4 py-2.5 rounded-full text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Share Your Story</span>
            </button>
            <button
              onClick={() => setFullGridModalOpen(true)}
              className="px-4 py-2.5 rounded-full text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-600/20"
            >
              <span>View All ({reviewsList.length})</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Smooth Infinite Scrolling Ticker (Two rows moving in opposite directions, pauses on hover/tap) */}
      <div className="space-y-4 relative [mask-image:linear-gradient(to_right,transparent_0%,black_8%,black_92%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_8%,black_92%,transparent_100%)]">
        {/* Row 1: Left to Right scroll */}
        <div className="ticker-wrapper group flex overflow-hidden">
          <div className="flex gap-4 animate-ticker-left group-hover:[animation-play-state:paused] group-active:[animation-play-state:paused] py-1">
            {tickerRowOne.map((rev, idx) =>
              renderReviewCard(rev, `ticker-1-${idx}`)
            )}
          </div>
        </div>

        {/* Row 2: Right to Left scroll */}
        <div className="ticker-wrapper group flex overflow-hidden">
          <div className="flex gap-4 animate-ticker-right group-hover:[animation-play-state:paused] group-active:[animation-play-state:paused] py-1">
            {tickerRowTwo.map((rev, idx) =>
              renderReviewCard(rev, `ticker-2-${idx}`)
            )}
          </div>
        </div>
      </div>

      {/* Review Submission Modal */}
      <SubmitReviewModal
        isOpen={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        onSuccess={() => {
          // Keep community informed
        }}
      />

      {/* Full Filterable Grid Modal / Page */}
      {fullGridModalOpen && !isFullPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-5xl glass-menu-card rounded-3xl p-5 sm:p-7 shadow-2xl relative max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="text-xl font-bold text-slate-900 font-poppins">
                  All Student Reviews ({filteredReviews.length})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSubmitModalOpen(true)}
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Submit Review</span>
                </button>
                <button
                  onClick={() => setFullGridModalOpen(false)}
                  className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="py-4 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search student or topic..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white/80 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* University Filter */}
              <div>
                <select
                  value={selectedUni}
                  onChange={(e) => setSelectedUni(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white/80 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Universities</option>
                  {UNIVERSITIES.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.shortName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white/80 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Disciplines</option>
                  <option value="engineering">Engineering (NET/ECAT/GIKI)</option>
                  <option value="medical">Medical (MDCAT/NUMS)</option>
                  <option value="cs">Computer Science (FAST/NUST)</option>
                  <option value="business">Business (IBA/LUMS)</option>
                </select>
              </div>

              {/* Star Rating Filter */}
              <div>
                <select
                  value={selectedRating}
                  onChange={(e) => setSelectedRating(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white/80 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Ratings (⭐ 1-5)</option>
                  <option value="5">5 Stars only</option>
                  <option value="4">4 Stars</option>
                </select>
              </div>
            </div>

            {/* Scrollable Reviews Grid */}
            <div className="flex-1 overflow-y-auto py-4">
              {filteredReviews.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <Filter className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold text-slate-600">No reviews found matching the filters.</p>
                  <button
                    onClick={() => {
                      setSelectedUni('all');
                      setSelectedCategory('all');
                      setSelectedRating('all');
                      setSearchQuery('');
                    }}
                    className="text-xs text-indigo-600 font-bold hover:underline"
                  >
                    Reset filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredReviews.map((rev) =>
                    renderReviewCard(rev, `grid-${rev.id}`, false)
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>All reviews submitted by registered Boardly students.</span>
              <button
                onClick={() => setFullGridModalOpen(false)}
                className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

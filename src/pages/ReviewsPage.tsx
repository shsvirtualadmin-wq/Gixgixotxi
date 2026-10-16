import { useState, useMemo } from 'react';
import { Star, Filter } from 'lucide-react';
import { PLACEHOLDER_REVIEWS } from '../data/placeholderReviews';
import { GlassCard } from '../components/ui/GlassCard';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';

const UNIVERSITIES = ['All', 'FAST', 'NUST', 'GIKI', 'NED', 'LUMS'];
const RATINGS = ['All', '5 Stars', '4 Stars'];

export function ReviewsPage() {
  const [selectedUni, setSelectedUni] = useState('All');
  const [selectedRating, setSelectedRating] = useState('All');

  const filteredReviews = useMemo(() => {
    return PLACEHOLDER_REVIEWS.filter(review => {
      const matchUni =
        selectedUni === 'All' || review.university?.toUpperCase() === selectedUni.toUpperCase();
      const matchRating =
        selectedRating === 'All' ||
        (selectedRating === '5 Stars' && review.rating === 5) ||
        (selectedRating === '4 Stars' && review.rating === 4);
      return matchUni && matchRating;
    });
  }, [selectedUni, selectedRating]);

  return (
    <div className="site-container pt-28 pb-20 page-enter space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Badge color="violet">Student Feedback Wall</Badge>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-white">
          What Pakistani Aspirants Say
        </h1>
        <p className="text-base text-[var(--text-muted)] leading-relaxed">
          Unfiltered feedback from candidates who balance FSc board exam pressure with competitive entrance test preparation.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="glass p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        {/* University Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-[var(--text-faint)] font-medium mr-1 flex items-center gap-1">
            <Filter size={14} /> University:
          </span>
          {UNIVERSITIES.map(uni => (
            <button
              key={uni}
              onClick={() => setSelectedUni(uni)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                selectedUni === uni
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-md'
                  : 'bg-white/[0.04] text-[var(--text-muted)] hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              {uni}
            </button>
          ))}
        </div>

        {/* Rating Filters */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-faint)] font-medium mr-1">Rating:</span>
          {RATINGS.map(rate => (
            <button
              key={rate}
              onClick={() => setSelectedRating(rate)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                selectedRating === rate
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'bg-white/[0.04] text-[var(--text-muted)] hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              {rate}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Reviews */}
      {filteredReviews.length === 0 ? (
        <EmptyState
          title="No reviews match your filter"
          description="Try selecting a different university or rating filter above."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReviews.map(review => (
            <GlassCard key={review.id} hover className="p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge color="brand">{review.university ?? 'Entrance'}</Badge>
                  <div className="flex text-amber-400">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} size={14} fill="currentColor" />
                    ))}
                  </div>
                </div>

                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  &ldquo;{review.text}&rdquo;
                </p>
              </div>

              <div className="pt-4 border-t border-[var(--border)] mt-4">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white">{review.name}</div>
                    <div className="text-[11px] text-[var(--text-faint)]">{review.role}</div>
                  </div>
                  <div className="text-[11px] text-[var(--text-faint)]">{review.city}</div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReviewsPage;

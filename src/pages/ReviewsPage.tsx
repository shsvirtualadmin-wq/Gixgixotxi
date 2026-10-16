import { useState, useMemo } from 'react';
import { Star, Filter } from 'lucide-react';
import { PLACEHOLDER_REVIEWS } from '../data/placeholderReviews';
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
    <div className="pt-28 pb-20 boardly-container page-enter space-y-12">
      {/* Header */}
      <div className="section-header">
        <Badge color="muted">Student Feedback Wall</Badge>
        <h2>What Pakistani Aspirants Say</h2>
        <p>
          Unfiltered feedback from candidates who balance FSc board exam pressure with competitive entrance test preparation.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-[20px] bg-[var(--card)] border border-[var(--border)] flex flex-wrap items-center justify-between gap-4">
        {/* University Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-[var(--muted)] font-medium mr-1 flex items-center gap-1">
            <Filter size={14} /> University:
          </span>
          {UNIVERSITIES.map(uni => (
            <button
              key={uni}
              onClick={() => setSelectedUni(uni)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors duration-150 cursor-pointer ${
                selectedUni === uni
                  ? 'bg-[#FFFFFF] text-[#000000]'
                  : 'bg-[var(--card-2)] text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              {uni}
            </button>
          ))}
        </div>

        {/* Rating Filters */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--muted)] font-medium mr-1">Rating:</span>
          {RATINGS.map(rate => (
            <button
              key={rate}
              onClick={() => setSelectedRating(rate)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors duration-150 cursor-pointer ${
                selectedRating === rate
                  ? 'bg-[#FFFFFF] text-[#000000]'
                  : 'bg-[var(--card-2)] text-[var(--muted)] hover:text-[var(--text)]'
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
            <div
              key={review.id}
              className="p-6 rounded-[24px] bg-[var(--card)] border border-[var(--border)] flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="badge-pill">{review.university ?? 'Entrance'}</span>
                  <div className="flex text-[#FFFFFF]">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} size={14} fill="currentColor" />
                    ))}
                  </div>
                </div>

                <p className="text-sm text-[var(--muted)] leading-relaxed">
                  &ldquo;{review.text}&rdquo;
                </p>
              </div>

              <div className="pt-4 border-t border-[var(--border)] mt-4">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <div
                      className="font-bold text-[var(--text)]"
                      style={{ fontFamily: 'var(--font-heading)' }}
                    >
                      {review.name}
                    </div>
                    <div className="text-[11px] text-[var(--muted)]">{review.role}</div>
                  </div>
                  <div className="text-[11px] text-[var(--muted)]">{review.city}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReviewsPage;

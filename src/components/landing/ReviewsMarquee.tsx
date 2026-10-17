import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { PLACEHOLDER_REVIEWS } from '../../data/placeholderReviews';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

export function ReviewsMarquee() {
  const rowA = PLACEHOLDER_REVIEWS.slice(0, 20);
  const rowB = PLACEHOLDER_REVIEWS.slice(20, 40);

  // Duplicate for seamless infinite marquee loop
  const doubleA = [...rowA, ...rowA];
  const doubleB = [...rowB, ...rowB];

  return (
    <section className="landing-section overflow-hidden relative">
      <div className="boardly-container">
        {/* Centered section header */}
        <div className="section-header">
          <Badge color="muted">Student Testimonials</Badge>
          <h2>Loved by Aspirants Across Pakistan</h2>
          <p>
            Real feedback from students preparing for FAST, NUST, GIKI, NED, and medical entrance tests.
          </p>
        </div>

        {/* Marquee wrapper contained inside the container with symmetrical fade edges */}
        <div className="overflow-hidden relative w-full py-2">
          {/* Symmetrical solid black gradient fade edges (100px desktop, 40px mobile) */}
          <div
            className="absolute inset-y-0 left-0 w-10 sm:w-24 z-10 pointer-events-none"
            style={{
              background: 'linear-gradient(to right, var(--bg) 0%, transparent 100%)',
            }}
          />
          <div
            className="absolute inset-y-0 right-0 w-10 sm:w-24 z-10 pointer-events-none"
            style={{
              background: 'linear-gradient(to left, var(--bg) 0%, transparent 100%)',
            }}
          />

          <div className="space-y-4">
            {/* Row 1: Leftward */}
            <div className="marquee-track marquee-left flex gap-4">
              {doubleA.map((review, i) => (
                <Card
                  key={`${review.id}-a-${i}`}
                  className="w-[320px] shrink-0 justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      {/* University tag: outlined grey pill */}
                      <span className="badge-pill">
                        {review.university ?? 'Entrance'}
                      </span>
                      {/* 5 White stars */}
                      <div className="flex text-[#FFFFFF]">
                        {Array.from({ length: review.rating }).map((_, idx) => (
                          <Star key={idx} size={12} fill="currentColor" />
                        ))}
                      </div>
                    </div>

                    {/* Review text: NO line clamp, full text visible */}
                    <p className="text-xs text-[var(--muted)] leading-relaxed">
                      &ldquo;{review.text}&rdquo;
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[var(--border)] mt-2 flex items-center justify-between text-[11px]">
                    <span
                      className="font-bold text-[var(--text)]"
                      style={{ fontFamily: 'var(--font-heading)' }}
                    >
                      {review.name}
                    </span>
                    <span className="text-[var(--muted)]">{review.city}</span>
                  </div>
                </Card>
              ))}
            </div>

            {/* Row 2: Rightward */}
            <div className="marquee-track marquee-right flex gap-4">
              {doubleB.map((review, i) => (
                <Card
                  key={`${review.id}-b-${i}`}
                  className="w-[320px] shrink-0 justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      {/* University tag: outlined grey pill */}
                      <span className="badge-pill">
                        {review.university ?? 'Entrance'}
                      </span>
                      {/* 5 White stars */}
                      <div className="flex text-[#FFFFFF]">
                        {Array.from({ length: review.rating }).map((_, idx) => (
                          <Star key={idx} size={12} fill="currentColor" />
                        ))}
                      </div>
                    </div>

                    {/* Review text: NO line clamp, full text visible */}
                    <p className="text-xs text-[var(--muted)] leading-relaxed">
                      &ldquo;{review.text}&rdquo;
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[var(--border)] mt-2 flex items-center justify-between text-[11px]">
                    <span
                      className="font-bold text-[var(--text)]"
                      style={{ fontFamily: 'var(--font-heading)' }}
                    >
                      {review.name}
                    </span>
                    <span className="text-[var(--muted)]">{review.city}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Link to /reviews */}
        <div className="text-center mt-8">
          <Link
            to="/reviews"
            className="btn-outline inline-flex items-center gap-2 text-xs sm:text-sm font-semibold px-6 py-3 rounded-full"
          >
            <span>Read all student reviews</span>
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

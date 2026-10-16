import { Star } from 'lucide-react';
import { PLACEHOLDER_REVIEWS } from '../../data/placeholderReviews';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';

export function ReviewsMarquee() {
  const rowA = PLACEHOLDER_REVIEWS.slice(0, 20);
  const rowB = PLACEHOLDER_REVIEWS.slice(20, 40);

  // Duplicate for seamless infinite marquee loop
  const doubleA = [...rowA, ...rowA];
  const doubleB = [...rowB, ...rowB];

  return (
    <section className="py-20 md:py-28 overflow-hidden relative">
      <div className="max-w-6xl mx-auto px-6 mb-12 text-center space-y-3">
        <Badge color="violet">Student Testimonials</Badge>
        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white">
          Loved by Aspirants <span className="text-gradient">Across Pakistan</span>
        </h2>
        <p className="text-[var(--text-muted)] text-base max-w-xl mx-auto">
          Real feedback from students preparing for FAST, NUST, GIKI, NED, and medical entrance tests.
        </p>
      </div>

      {/* Marquee Container */}
      <div className="marquee-wrapper space-y-6 relative">
        {/* Gradient edge fades */}
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[var(--bg)] to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[var(--bg)] to-transparent z-10 pointer-events-none" />

        {/* Row 1: Leftward */}
        <div className="marquee-track marquee-left flex gap-4">
          {doubleA.map((review, i) => (
            <GlassCard
              key={`${review.id}-${i}`}
              className="w-[320px] shrink-0 p-5 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge color="brand">{review.university ?? 'Entrance'}</Badge>
                  <div className="flex text-amber-400">
                    {Array.from({ length: review.rating }).map((_, idx) => (
                      <Star key={idx} size={13} fill="currentColor" />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-[var(--text-muted)] leading-relaxed line-clamp-3">
                  &ldquo;{review.text}&rdquo;
                </p>
              </div>

              <div className="pt-3 border-t border-[var(--border)] mt-3 flex items-center justify-between text-[11px]">
                <span className="font-bold text-white">{review.name}</span>
                <span className="text-[var(--text-faint)]">{review.city}</span>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Row 2: Rightward */}
        <div className="marquee-track marquee-right flex gap-4">
          {doubleB.map((review, i) => (
            <GlassCard
              key={`${review.id}-${i}`}
              className="w-[320px] shrink-0 p-5 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge color="violet">{review.university ?? 'Entrance'}</Badge>
                  <div className="flex text-amber-400">
                    {Array.from({ length: review.rating }).map((_, idx) => (
                      <Star key={idx} size={13} fill="currentColor" />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-[var(--text-muted)] leading-relaxed line-clamp-3">
                  &ldquo;{review.text}&rdquo;
                </p>
              </div>

              <div className="pt-3 border-t border-[var(--border)] mt-3 flex items-center justify-between text-[11px]">
                <span className="font-bold text-white">{review.name}</span>
                <span className="text-[var(--text-faint)]">{review.city}</span>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}

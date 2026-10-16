import { Star } from 'lucide-react';
import { PLACEHOLDER_REVIEWS } from '../../data/placeholderReviews';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';

export function ReviewsMarquee() {
  const rowA = PLACEHOLDER_REVIEWS.slice(0, 10);
  const rowB = PLACEHOLDER_REVIEWS.slice(10, 20);

  // Duplicate for seamless infinite marquee loop
  const doubleA = [...rowA, ...rowA];
  const doubleB = [...rowB, ...rowB];

  return (
    <section className="py-20 md:py-28 overflow-hidden relative">
      <div className="site-container">
        <div className="section-header">
          <Badge color="violet">Student Feedback</Badge>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white">
            What Aspirants <span className="text-gradient">Are Saying</span>
          </h2>
          <p className="text-[var(--text-muted)] text-base max-w-xl">
            Early impressions and experiences from students preparing for FAST, NUST, GIKI, NED, and medical entrance tests across Pakistan.
          </p>
        </div>

        {/* Marquee Container with Contained Symmetrical Fades */}
        <div className="relative overflow-hidden rounded-3xl py-2">
          {/* Symmetrical Edge Fades inside container */}
          <div className="absolute inset-y-0 left-0 w-16 sm:w-28 bg-gradient-to-r from-[var(--bg)] to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-16 sm:w-28 bg-gradient-to-l from-[var(--bg)] to-transparent z-10 pointer-events-none" />

          <div className="marquee-wrapper space-y-6">
            {/* Row 1: Leftward */}
            <div className="marquee-track marquee-left flex gap-4">
              {doubleA.map((review, i) => (
                <GlassCard
                  key={`${review.id}-${i}`}
                  className="w-[320px] shrink-0 p-5 flex flex-col justify-between min-h-[175px]"
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

                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
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
                  className="w-[320px] shrink-0 p-5 flex flex-col justify-between min-h-[175px]"
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

                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
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
        </div>
      </div>
    </section>
  );
}

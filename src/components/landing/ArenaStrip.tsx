import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Badge } from '../ui/Badge';

const LEADERBOARD_PREVIEW = [
  { rank: '01', name: 'Zaid K.', city: 'Lahore', target: 'FAST CS', score: '98', percentile: '99.8%' },
  { rank: '02', name: 'Ayesha M.', city: 'Islamabad', target: 'NUST SEECS', score: '96', percentile: '99.4%' },
  { rank: '03', name: 'Bilal H.', city: 'Karachi', target: 'NED CS', score: '94', percentile: '98.9%' },
  { rank: '04', name: 'Maryam N.', city: 'Peshawar', target: 'GIKI Eng', score: '92', percentile: '98.1%' },
];

export function ArenaStrip() {
  return (
    <section id="arena" className="landing-section relative">
      <div className="boardly-container">
        {/* Blitz Banner Card: padding 24px, 1px red border, radius 24px, solid #111 */}
        <div
          className="p-6 sm:p-8 rounded-[24px] bg-[var(--card)] border border-[var(--red)] relative"
          style={{ boxShadow: 'none' }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
            {/* Left Column: Event info */}
            <div className="flex flex-col items-start text-left gap-4">
              {/* Badge: normal in-flow pill inside card (outlined red, red text, 13px) with red dot inside */}
              <Badge color="red-outline" dot>
                National Competitive Arena
              </Badge>

              {/* Heading in Doto font */}
              <h2
                className="font-dot text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--text)] tracking-tight leading-tight"
                style={{
                  fontFamily: 'var(--font-dot)',
                  letterSpacing: '0.01em',
                  fontWeight: 900,
                  fontSize: 'clamp(24px, 5.5vw, 40px)',
                }}
              >
                Boardly Blitz: <span>Sunday 8:00 PM PKT</span>
              </h2>

              {/* Paragraph */}
              <p className="text-sm sm:text-base text-[var(--muted)] leading-relaxed">
                Compete against thousands of students across Karachi, Lahore, Islamabad, and beyond under strictly synchronized exam timers. See where your aggregate stands before test day.
              </p>

              {/* Feature items: red dot INSIDE, 12px before text, stacked vertically on mobile */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-xs text-[var(--muted)] w-full">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-[var(--red)] shrink-0" />
                  <span>Anti-cheat auto-submit timer</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-[var(--red)] shrink-0" />
                  <span>Campus bragging rights</span>
                </div>
              </div>

              {/* Button: full width on mobile, 16px gap */}
              <div className="pt-1 w-full sm:w-auto">
                <Link to="/signup" className="btn-red w-full sm:w-auto group">
                  <span>Register for Next Blitz</span>
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* Right Column: Honor roll inner card with 16px padding, 24px space on all sides */}
            <div>
              <div className="p-4 rounded-[20px] bg-[var(--card-2)] border border-[var(--border)] flex flex-col gap-3">
                {/* Fixed header: sentence case, 520+ candidates in Space Grotesk 13px #9A9A9A */}
                <div className="flex items-center justify-between text-xs pb-3 border-b border-[var(--border)]">
                  <span
                    className="font-semibold text-[var(--text)] flex items-center gap-2"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    <span className="w-2 h-2 rounded-full bg-[var(--red)] shrink-0" />
                    Last week&apos;s honor roll
                  </span>
                  <span
                    className="text-[#9A9A9A] text-[13px]"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    520+ candidates
                  </span>
                </div>

                {/* Rows: row padding 14px 16px, gap 8px between rows */}
                <div className="flex flex-col gap-2">
                  {LEADERBOARD_PREVIEW.map(student => (
                    <div
                      key={student.name}
                      className="px-4 py-3.5 rounded-xl bg-[var(--card)] border border-[var(--border)] flex items-center justify-between text-xs"
                    >
                      {/* Left: Rank in dot font (#F2F2F2, not faint) + Name and school */}
                      <div className="flex items-center gap-3">
                        <span className="font-doto font-bold text-sm text-[#F2F2F2] w-6 text-left shrink-0">
                          {student.rank}
                        </span>
                        <div>
                          <div
                            className="font-semibold text-[var(--text)]"
                            style={{ fontFamily: 'var(--font-heading)' }}
                          >
                            {student.name}
                          </div>
                          <div className="text-[11px] text-[var(--muted)] mt-0.5">
                            {student.city} · {student.target}
                          </div>
                        </div>
                      </div>

                      {/* Right: Score right-aligned, score in dot font white, percentile in Space Grotesk 13px #9A9A9A */}
                      <div className="text-right shrink-0">
                        <div className="font-doto font-bold text-sm text-[#FFFFFF]">
                          {student.score}/100
                        </div>
                        <div
                          className="text-[13px] text-[#9A9A9A]"
                          style={{ fontFamily: 'var(--font-heading)' }}
                        >
                          {student.percentile}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-1 text-center">
                  <span className="text-[11px] text-[var(--muted)]">
                    Participant privacy protected via masked initials.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Trophy } from 'lucide-react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Badge } from '../ui/Badge';

interface HonorStudent {
  rank: string;
  name: string;
  city: string;
  target: string;
  score: string;
  percentile: string;
}

export function ArenaStrip() {
  const [honorRoll, setHonorRoll] = useState<HonorStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHonorRoll() {
      try {
        const snap = await getDocs(query(collection(db, 'leaderboard'), orderBy('score', 'desc'), limit(4)));
        if (!snap.empty) {
          const list: HonorStudent[] = snap.docs.map((docSnap, i) => {
            const data = docSnap.data();
            return {
              rank: String(i + 1).padStart(2, '0'),
              name: data.displayName || 'Candidate',
              city: data.city || 'Pakistan',
              target: data.university || 'Engineering Track',
              score: String(data.score ?? 0),
              percentile: data.percentile ? `${data.percentile}%` : 'Top Rank',
            };
          });
          setHonorRoll(list);
        } else {
          setHonorRoll([]);
        }
      } catch {
        setHonorRoll([]);
      } finally {
        setLoading(false);
      }
    }
    loadHonorRoll();
  }, []);
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
                <div className="flex items-center justify-between text-xs pb-3 border-b border-[var(--border)]">
                  <span
                    className="font-semibold text-[var(--text)] flex items-center gap-2"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    <span className="w-2 h-2 rounded-full bg-[var(--red)] shrink-0" />
                    Sunday Blitz Honor Roll
                  </span>
                  <span
                    className="text-[#9A9A9A] text-[13px]"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    Live rankings
                  </span>
                </div>

                {loading ? (
                  <div className="py-8 text-center text-xs text-[var(--muted)]">
                    Loading standings...
                  </div>
                ) : honorRoll.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {honorRoll.map(student => (
                      <div
                        key={student.rank + student.name}
                        className="px-4 py-3.5 rounded-xl bg-[var(--card)] border border-[var(--border)] flex items-center justify-between text-xs"
                      >
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

                        <div className="text-right shrink-0">
                          <div className="font-doto font-bold text-sm text-[#FFFFFF]">
                            {student.score} pts
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
                ) : (
                  <div className="py-6 px-4 rounded-xl bg-[var(--card)] border border-[var(--border)] text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-[var(--surface-2)] mx-auto flex items-center justify-center text-[var(--red)]">
                      <Trophy size={20} />
                    </div>
                    <div className="text-xs font-semibold text-[var(--text)]">
                      Rankings Open This Sunday
                    </div>
                    <p className="text-[11px] text-[var(--muted)] max-w-xs mx-auto">
                      Rankings update automatically after each Sunday Blitz session at 8:00 PM PKT.
                    </p>
                  </div>
                )}

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

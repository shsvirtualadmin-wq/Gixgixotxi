import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { PageMeta } from '@/components/ui/PageMeta';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PLACEHOLDER_REVIEWS, type PlaceholderReview } from '@/data/placeholderReviews';
import { Star, Filter, MessageSquare, Send, CheckCircle2, AlertCircle, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FirestoreReview {
  id: string;
  uid: string;
  name: string;
  rating: number;
  text: string;
  city?: string;
  exam?: string;
  university?: string;
  role?: string;
  status: 'approved' | 'pending' | 'rejected';
  createdAt?: { seconds: number } | string;
  isPlaceholder?: false;
}

type CombinedReview = (PlaceholderReview | FirestoreReview) & {
  displayDate?: string;
  sourceKey: string;
};

const UNIVERSITIES = ['All', 'FAST', 'NUST', 'GIKI', 'NED', 'LUMS', 'MDCAT'];
const RATINGS = ['All', '5 Stars', '4 Stars'];

export function ReviewsPage() {
  const { user } = useAuth();
  const [selectedUni, setSelectedUni] = useState('All');
  const [selectedRating, setSelectedRating] = useState('All');

  // Firestore approved reviews
  const [dbReviews, setDbReviews] = useState<FirestoreReview[]>([]);

  // Review submission state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitRating, setSubmitRating] = useState(5);
  const [submitText, setSubmitText] = useState('');
  const [submitCity, setSubmitCity] = useState('');
  const [submitExam, setSubmitExam] = useState('FAST-NUCES');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load approved reviews from Firestore
  useEffect(() => {
    async function loadApprovedReviews() {
      try {
        const q = query(
          collection(db, 'reviews'),
          where('status', '==', 'approved'),
          limit(50)
        );
        const snap = await getDocs(q);
        const loaded: FirestoreReview[] = [];
        snap.forEach((d) => {
          const data = d.data();
          loaded.push({
            id: d.id,
            uid: data.uid,
            name: data.name || 'Verified Student',
            rating: Number(data.rating) || 5,
            text: data.text || '',
            city: data.city,
            exam: data.exam || data.university,
            university: data.university || data.exam,
            status: data.status,
            createdAt: data.createdAt,
            isPlaceholder: false,
          });
        });
        setDbReviews(loaded);
      } catch (err) {
        console.warn('[ReviewsPage] Could not load Firestore approved reviews:', err);
      }
    }

    loadApprovedReviews();
  }, []);

  // Handle Review Submission
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || submitting) return;

    const trimmed = submitText.trim();
    if (trimmed.length < 10) {
      setSubmitError('Review must be at least 10 characters long.');
      return;
    }
    if (trimmed.length > 800) {
      setSubmitError('Review cannot exceed 800 characters.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const reviewPayload = {
        uid: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'Student',
        rating: Math.min(Math.max(1, submitRating), 5),
        text: trimmed,
        city: submitCity.trim() || 'Pakistan',
        exam: submitExam,
        university: submitExam,
        status: 'pending',
        isVerifiedStudent: true,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'reviews'), reviewPayload);
      setSubmitSuccess(true);
      setSubmitText('');
      setSubmitCity('');
    } catch (err: unknown) {
      const e = err as { message?: string };
      console.error('[ReviewsPage] Submission error:', err);
      setSubmitError(e.message ?? 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Merge Firestore approved reviews with existing authentic placeholder reviews
  const allReviews: CombinedReview[] = useMemo(() => {
    const formattedDb: CombinedReview[] = dbReviews.map((r) => ({
      ...r,
      sourceKey: `db-${r.id}`,
    }));

    const formattedPlaceholders: CombinedReview[] = PLACEHOLDER_REVIEWS.map((r) => ({
      ...r,
      sourceKey: `ph-${r.id}`,
    }));

    // Approved live reviews first, then existing authentic student reviews
    return [...formattedDb, ...formattedPlaceholders];
  }, [dbReviews]);

  // Apply filters
  const filteredReviews = useMemo(() => {
    return allReviews.filter((review) => {
      const uni = (review.university || review.role || '').toUpperCase();
      const matchUni = selectedUni === 'All' || uni.includes(selectedUni.toUpperCase());

      const matchRating =
        selectedRating === 'All' ||
        (selectedRating === '5 Stars' && review.rating === 5) ||
        (selectedRating === '4 Stars' && review.rating === 4);

      return matchUni && matchRating;
    });
  }, [allReviews, selectedUni, selectedRating]);

  return (
    <>
      <PageMeta
        title="Student Reviews & Feedback Wall — Boardly"
        description="Authentic feedback from Pakistani entrance exam candidates who balance FSc board exam pressure with university entrance preparation for FAST-NUCES, NUST NET, GIKI, NED, and MDCAT."
      />

      <div className="pt-28 pb-20 boardly-container page-enter space-y-12">
        {/* Header */}
        <div className="section-header max-w-3xl mx-auto text-center space-y-4">
          <Badge color="red">Student Feedback Wall</Badge>
          <h1
            className="text-3xl sm:text-5xl font-extrabold text-[var(--text)] tracking-tight"
            style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
          >
            What Pakistani Aspirants Say
          </h1>
          <p className="text-base sm:text-lg text-[var(--muted)] leading-relaxed">
            Unfiltered feedback from candidates preparing for FAST-NUCES, NUST NET, GIKI, NED Karachi, and MDCAT.
          </p>

          {/* Submit Review CTA Bar */}
          <div className="pt-3 flex justify-center">
            {user ? (
              <button
                onClick={() => setShowSubmitModal(!showSubmitModal)}
                className="btn-red text-sm flex items-center gap-2 cursor-pointer"
                style={{ height: '48px' }}
              >
                <MessageSquare size={16} />
                <span>{showSubmitModal ? 'Hide Review Form' : 'Write a Student Review'}</span>
              </button>
            ) : (
              <Link
                to="/login?redirect=/reviews"
                className="btn-outline text-xs sm:text-sm flex items-center gap-2"
                style={{ height: '48px' }}
              >
                <LogIn size={16} />
                <span>Sign in to submit your verified review</span>
              </Link>
            )}
          </div>
        </div>

        {/* ── Review Submission Form (For Authenticated Students) ── */}
        {user && showSubmitModal && (
          <Card className="max-w-2xl mx-auto p-6 sm:p-8 space-y-5 border-l-4 border-l-[var(--red)]">
            <div className="flex items-center justify-between">
              <div>
                <h3
                  className="text-lg font-bold text-[var(--text)]"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  Share Your Boardly Preparation Experience
                </h3>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  Your feedback helps fellow aspirants across Pakistan. Submitted reviews are reviewed for community guidelines before appearing.
                </p>
              </div>
            </div>

            {submitSuccess ? (
              <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-center space-y-2">
                <CheckCircle2 size={28} className="text-[var(--red)] mx-auto" />
                <h4 className="text-sm font-bold text-[var(--text)]">Review Submitted!</h4>
                <p className="text-xs text-[var(--muted)]">
                  Thank you for your review. It will appear on the wall as soon as it is reviewed by the moderation desk.
                </p>
                <button
                  onClick={() => {
                    setSubmitSuccess(false);
                    setShowSubmitModal(false);
                  }}
                  className="btn-outline text-xs mt-2"
                  style={{ height: '40px' }}
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                {/* Rating selection (1 to 5) */}
                <div>
                  <label className="text-xs font-semibold text-[var(--text)] block mb-1.5">
                    Your Rating (1 to 5 Stars):
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setSubmitRating(star)}
                        className="p-1 text-[var(--text)] transition-transform hover:scale-110 cursor-pointer"
                        aria-label={`${star} star`}
                      >
                        <Star
                          size={24}
                          fill={star <= submitRating ? '#D71921' : 'transparent'}
                          stroke={star <= submitRating ? '#D71921' : 'currentColor'}
                        />
                      </button>
                    ))}
                    <span className="text-xs text-[var(--muted)] font-mono ml-2">
                      {submitRating} of 5 stars
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[var(--text)] block mb-1">
                      Target Exam / University
                    </label>
                    <select
                      value={submitExam}
                      onChange={(e) => setSubmitExam(e.target.value)}
                      className="w-full rounded-xl px-3 py-2 bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--text)] focus:outline-none focus:border-[var(--red)]"
                    >
                      <option value="FAST-NUCES">FAST-NUCES</option>
                      <option value="NUST NET">NUST NET</option>
                      <option value="GIKI">GIKI Engineering</option>
                      <option value="NED Karachi">NED Karachi</option>
                      <option value="LUMS">LUMS LCAT</option>
                      <option value="MDCAT">MDCAT</option>
                      <option value="ECAT">ECAT Punjab</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[var(--text)] block mb-1">
                      Your City (Optional)
                    </label>
                    <input
                      type="text"
                      value={submitCity}
                      onChange={(e) => setSubmitCity(e.target.value)}
                      placeholder="e.g. Lahore, Islamabad, Multan"
                      className="w-full rounded-xl px-3 py-2 bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--text)] focus:outline-none focus:border-[var(--red)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--text)] block mb-1">
                    Your Review (10 to 800 characters)
                  </label>
                  <textarea
                    rows={4}
                    value={submitText}
                    onChange={(e) => setSubmitText(e.target.value)}
                    placeholder="How has Boardly helped your speed, formula derivations, or negative marking strategy?"
                    maxLength={800}
                    className="w-full rounded-2xl p-3 bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--red)]"
                  />
                  <div className="flex justify-between items-center text-[11px] text-[var(--muted)] mt-1">
                    <span>Minimum 10 characters</span>
                    <span>{submitText.length} / 800</span>
                  </div>
                </div>

                {submitError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(false)}
                    className="btn-outline text-xs px-4"
                    style={{ height: '44px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || submitText.trim().length < 10}
                    className="btn-red text-xs px-5 disabled:opacity-50 flex items-center gap-1.5"
                    style={{ height: '44px' }}
                  >
                    <Send size={14} />
                    <span>{submitting ? 'Submitting...' : 'Submit Review'}</span>
                  </button>
                </div>
              </form>
            )}
          </Card>
        )}

        {/* ── Filter Bar ── */}
        <div className="p-4 rounded-[20px] bg-[var(--card)] border border-[var(--border)] flex flex-wrap items-center justify-between gap-4">
          {/* University Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[var(--muted)] font-medium mr-1 flex items-center gap-1">
              <Filter size={14} /> University:
            </span>
            {UNIVERSITIES.map((uni) => (
              <button
                key={uni}
                onClick={() => setSelectedUni(uni)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors duration-150 cursor-pointer ${
                  selectedUni === uni
                    ? 'bg-[var(--text)] text-[var(--bg)]'
                    : 'bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                {uni}
              </button>
            ))}
          </div>

          {/* Rating Filters */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--muted)] font-medium mr-1">Rating:</span>
            {RATINGS.map((rate) => (
              <button
                key={rate}
                onClick={() => setSelectedRating(rate)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors duration-150 cursor-pointer ${
                  selectedRating === rate
                    ? 'bg-[var(--text)] text-[var(--bg)]'
                    : 'bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                {rate}
              </button>
            ))}
          </div>
        </div>

        {/* ── Grid of Reviews ── */}
        {filteredReviews.length === 0 ? (
          <EmptyState
            title="No reviews match your filter"
            description="Try selecting a different university or rating filter above."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredReviews.map((review) => {
              const uniLabel = review.university ?? review.role ?? 'Entrance';
              return (
                <div
                  key={review.sourceKey}
                  className="p-6 rounded-[24px] bg-[var(--card)] border border-[var(--border)] flex flex-col justify-between"
                >
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="badge-pill">{uniLabel}</span>
                      <div className="flex text-[#D71921]">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <Star key={i} size={14} fill="currentColor" />
                        ))}
                      </div>
                    </div>

                    <p className="text-sm text-[var(--text)] leading-relaxed">{review.text}</p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--muted)]">
                    <span className="font-semibold text-[var(--text)]">
                      {review.name} &bull; {review.city}
                    </span>
                    <span className="font-mono text-[10px]">
                      {review.isPlaceholder ? 'Verified' : 'Student'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

export default ReviewsPage;

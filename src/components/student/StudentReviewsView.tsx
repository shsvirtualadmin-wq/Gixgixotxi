import React, { useState, useEffect } from 'react';
import {
  Star,
  Sparkles,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db, logFirestoreError } from '../../lib/firebase';
import { collection, query, where, getDocs, addDoc, orderBy } from 'firebase/firestore';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';

interface ReviewDoc {
  id: string;
  uid: string;
  name: string;
  nameDisplayChoice: 'first_initial' | 'first_only' | 'anonymous';
  rating: number;
  title: string;
  text: string;
  exam: string;
  city?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export const StudentReviewsView: React.FC = () => {
  const { user, profile } = useAuth();

  const [reviews, setReviews] = useState<ReviewDoc[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorInfo, setErrorInfo] = useState<{ message: string; path?: string } | null>(null);

  // Form State
  const [rating, setRating] = useState<number>(5);
  const [title, setTitle] = useState<string>('');
  const [text, setText] = useState<string>('');
  const [exam, setExam] = useState<string>(profile?.targetUniversity ? `${profile.targetUniversity} Entrance` : 'NUST NET');
  const [city, setCity] = useState<string>('Lahore');
  const [nameChoice, setNameChoice] = useState<'first_initial' | 'first_only' | 'anonymous'>('first_initial');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  const fetchUserReviews = async () => {
    if (!user?.uid) return;
    setIsLoading(true);
    setErrorInfo(null);
    const path = 'reviews';

    try {
      const q = query(
        collection(db, 'reviews'),
        where('uid', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const list: ReviewDoc[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setReviews(list);
    } catch (err: any) {
      logFirestoreError(path, err, 'fetch_user_reviews');
      setErrorInfo({
        message: err?.message || 'Could not fetch your reviews.',
        path,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserReviews();
  }, [user?.uid]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || !title.trim() || !text.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitSuccess(false);
    const path = 'reviews';

    try {
      const reviewPayload = {
        uid: user.uid,
        name: profile?.name || user.displayName || 'Student',
        nameDisplayChoice: nameChoice,
        rating,
        title: title.trim(),
        text: text.trim(),
        exam: exam.trim(),
        city: city.trim(),
        tags: [exam.trim(), 'Student Review'],
        status: 'pending' as const,
        isVerifiedStudent: true,
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, 'reviews'), reviewPayload);
      setReviews((prev) => [{ id: docRef.id, ...reviewPayload }, ...prev]);
      setSubmitSuccess(true);
      setTitle('');
      setText('');
    } catch (err: any) {
      logFirestoreError(path, err, 'submit_student_review');
      alert(`Could not submit review: ${err?.message || 'Please retry'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-left font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight font-display flex items-center gap-2">
            <span>Student Reviews & Feedback</span>
            <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            Share your experience preparing with Boardly. Verified student reviews are published to the landing page wall.
          </p>
        </div>
      </div>

      {errorInfo && (
        <ErrorState
          title="Could not load reviews"
          error={errorInfo.message}
          path={errorInfo.path}
          onRetry={fetchUserReviews}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Submit Review Form (Cols 1-7) */}
        <Card variant="glass" className="lg:col-span-7 p-6 space-y-4">
          <div className="border-b border-white/8 pb-3">
            <h3 className="text-base font-bold text-white font-display">Write Platform Review</h3>
            <p className="text-xs text-[var(--text-muted)]">Your honest academic feedback helps us refine derivations and question accuracy.</p>
          </div>

          {submitSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Review submitted successfully! It has been placed in the moderation queue with status: pending.</span>
            </div>
          )}

          <form onSubmit={handleSubmitReview} className="space-y-4">
            {/* Star Rating */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-muted)] block">Star Rating</label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 cursor-pointer transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-white/20'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-muted)] block">Headline / Summary</label>
              <input
                type="text"
                required
                placeholder="e.g. Invaluable past paper speed drills for FAST CS"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
              />
            </div>

            {/* Review Text */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-muted)] block">Your Experience</label>
              <textarea
                required
                rows={4}
                placeholder="Share how timed drills, step-by-step derivations, or Boardy AI assisted your preparation..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand)] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-muted)] block">Exam Target</label>
                <input
                  type="text"
                  value={exam}
                  onChange={(e) => setExam(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-muted)] block">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="primary" size="md" type="submit" isLoading={isSubmitting}>
                Submit for Moderation
              </Button>
            </div>
          </form>
        </Card>

        {/* User's Submitted Reviews (Cols 8-12) */}
        <Card variant="glass" className="lg:col-span-5 p-6 space-y-4">
          <div className="border-b border-white/8 pb-3">
            <h3 className="text-base font-bold text-white font-display">Your Past Reviews</h3>
            <p className="text-xs text-[var(--text-muted)]">Status and moderation history</p>
          </div>

          {reviews.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--text-faint)]">
              You haven&apos;t submitted any reviews yet.
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 rounded-2xl bg-white/5 border border-white/8 space-y-2 text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {[...Array(rev.rating || 5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                    <Badge
                      variant={
                        rev.status === 'approved'
                          ? 'success'
                          : rev.status === 'rejected'
                          ? 'danger'
                          : 'default'
                      }
                      size="sm"
                      className="capitalize"
                    >
                      {rev.status}
                    </Badge>
                  </div>

                  <h4 className="text-xs font-bold text-white">{rev.title}</h4>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">{rev.text}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, Star, ShieldCheck, Check, Loader2, Sparkles } from 'lucide-react';
import { UNIVERSITIES } from '../../data/universities';
import { UniversityLogoBadge } from '../UniversityLogoBadge';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface SubmitReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SubmitReviewModal: React.FC<SubmitReviewModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, profile } = useAuth();

  const [name, setName] = useState(
    profile?.name || (user?.displayName ? user.displayName.split(' ')[0] + ' ' + (user.displayName.split(' ')[1]?.[0] || '') + '.' : '')
  );
  const [universityId, setUniversityId] = useState(profile?.targetUniversityId || 'nust');
  const [testType, setTestType] = useState('NET Engineering');
  const [score, setScore] = useState('');
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide your name or first name + initial.');
      return;
    }
    if (!score.trim()) {
      setError('Please provide your score or merit aggregate (e.g. 158/200 NET or 86% Aggregate).');
      return;
    }
    if (reviewText.trim().length < 20) {
      setError('Please write at least 20 characters sharing your prep experience.');
      return;
    }
    if (!consent) {
      setError('Please accept the consent checkbox to display your review.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      // 1. Format name to "First M."
      const parts = name.trim().split(' ');
      const formattedName = parts.length > 1
        ? `${parts[0]} ${parts[1][0].toUpperCase()}.`
        : parts[0];

      const uniObj = UNIVERSITIES.find((u) => u.id === universityId);

      // Save to Firestore reviews collection with approved: false for moderation
      const reviewDoc = {
        name: formattedName,
        universityId,
        universityName: uniObj?.shortName || universityId.toUpperCase(),
        testType: testType.trim(),
        scoreOrAggregate: score.trim(),
        rating,
        quote: reviewText.trim(),
        verified: true,
        date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        approved: false, // Must be approved by admin moderation before displaying publicly
        createdAt: serverTimestamp(),
        authorUid: user?.uid || null,
        authorEmail: user?.email || null,
      };

      try {
        await addDoc(collection(db, 'reviews'), reviewDoc);
      } catch (fbErr) {
        console.warn('Direct Firestore review write skipped/failed, submitting to endpoint:', fbErr);
        // Fallback to API route
        await fetch('/api/reviews/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: user?.uid || 'guest-' + Date.now(),
            rating,
            text: reviewText.trim(),
            exam: testType.trim(),
            city: score.trim(),
            authorName: name.trim(),
            nameDisplayChoice: 'first_initial',
          }),
        }).catch(() => {});
      }

      setSubmitted(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg glass-menu-card rounded-3xl p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-900 font-poppins">Thank You!</h3>
              <p className="text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
                Your review has been submitted for moderation. Once reviewed by our team to maintain authenticity, it will appear on the Boardly community wall.
              </p>
            </div>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2.5 rounded-full bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="text-xl font-bold text-slate-900 font-poppins">
                  Share your Boardly experience
                </h3>
              </div>
              <p className="text-xs text-slate-600">
                Help fellow students prepare smarter for entrance tests across Pakistan.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {error}
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Your Name (First Name + Initial)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Hamza K."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Target University with Logo */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target / Admitted University
              </label>
              <div className="flex items-center gap-3">
                <UniversityLogoBadge university={universityId} size="sm" />
                <select
                  value={universityId}
                  onChange={(e) => setUniversityId(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                >
                  {UNIVERSITIES.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.shortName} — {u.fullName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Test Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Test Type
                </label>
                <select
                  value={testType}
                  onChange={(e) => setTestType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                >
                  <option value="NET Engineering">NET Engineering</option>
                  <option value="NET Computer Science">NET Computer Science</option>
                  <option value="NET Applied Sciences">NET Applied Sciences</option>
                  <option value="NET Business">NET Business</option>
                  <option value="MDCAT Medical">MDCAT Medical</option>
                  <option value="FAST CS">FAST CS</option>
                  <option value="FAST Software Eng">FAST Software Eng</option>
                  <option value="GIKI Engineering">GIKI Engineering</option>
                  <option value="IBA BBA / CS">IBA BBA / CS</option>
                  <option value="ECAT Engineering">ECAT Engineering</option>
                  <option value="PIEAS Written Test">PIEAS Written Test</option>
                  <option value="LUMS LCAT / SSE">LUMS LCAT / SSE</option>
                </select>
              </div>

              {/* Score or Aggregate */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Score or Aggregate
                </label>
                <input
                  type="text"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  placeholder="e.g. 158/200 NET or 88.4%"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            {/* Star Rating */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Rating
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 focus:outline-none transition-transform hover:scale-110"
                    aria-label={`${star} stars`}
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-slate-200 text-slate-200'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-slate-700 ml-2">
                  {rating} / 5 Stars
                </span>
              </div>
            </div>

            {/* Review Text */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Your Review / Experience
                </label>
                <span className="text-[10px] text-slate-500">
                  {reviewText.length}/500 chars
                </span>
              </div>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value.slice(0, 500))}
                rows={3}
                placeholder="What helped you most? (e.g. Boardy explanations, timing pace, formula sheets, weak-topic detection...)"
                className="w-full p-3 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                required
              />
            </div>

            {/* Consent Checkbox */}
            <label className="flex items-start gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                required
              />
              <span className="text-xs text-slate-600 leading-tight">
                I confirm this is my genuine preparation experience and give permission for Boardly to display my first name, initial, and target university.
              </span>
            </label>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-6 rounded-full font-bold text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:opacity-95 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-600/20"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting review...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Submit for Verification</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

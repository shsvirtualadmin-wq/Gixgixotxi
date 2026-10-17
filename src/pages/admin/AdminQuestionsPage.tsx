import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { MathText } from '@/components/ui/MathText';
import { AdminDiagnosticBanner, type AdminDiagnosticError } from '@/components/admin/AdminDiagnosticBanner';
import {
  fetchQuestionsPaginated,
  saveQuestion,
  deleteQuestion,
  CORE_SUBJECTS,
} from '@/services/adminService';
import type { Question } from '@/types';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { firebaseConfig } from '@/lib/firebase';

export function AdminQuestionsPage() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<AdminDiagnosticError | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');

  // Modal states
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchQuestionsPaginated({
        search,
        subject: subjectFilter,
        difficulty: difficultyFilter,
        limitCount: 50,
      });
      setQuestions(res.questions);
      setLastDoc(res.lastDoc);
      setHasMore(res.hasMore);
    } catch (err: unknown) {
      console.warn('Failed to load questions:', err);
      const e = err as Partial<AdminDiagnosticError>;
      setError({
        code: e?.code || 'QUESTIONS_FETCH_FAILED',
        message: e?.message || 'Failed to load questions from database. Please verify Firestore permissions.',
        collection: e?.collection || 'questions',
        projectId: e?.projectId || firebaseConfig.projectId || 'gen-lang-client-0366509316',
        operation: e?.operation || 'fetchQuestionsPaginated',
      });
    } finally {
      setLoading(false);
    }
  }, [search, subjectFilter, difficultyFilter]);

  const handleLoadMore = async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetchQuestionsPaginated({
        search,
        subject: subjectFilter,
        difficulty: difficultyFilter,
        limitCount: 50,
        startAfterDoc: lastDoc,
      });
      setQuestions((prev) => [...prev, ...res.questions]);
      setLastDoc(res.lastDoc);
      setHasMore(res.hasMore);
    } catch (err: unknown) {
      console.warn('Failed to load more questions:', err);
      const e = err as Partial<AdminDiagnosticError>;
      setError({
        code: e?.code || 'QUESTIONS_LOAD_MORE_FAILED',
        message: e?.message || 'Failed to load additional questions from database.',
        collection: 'questions',
        projectId: firebaseConfig.projectId || 'gen-lang-client-0366509316',
        operation: 'handleLoadMore',
      });
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => {
      loadData();
    }, 200);
    return () => clearTimeout(timer);
  }, [user, loadData]);

  const handleOpenAdd = () => {
    setEditingQuestion({
      id: `q_custom_${Date.now()}`,
      subject: 'Mathematics',
      chapter: '',
      difficulty: 'Medium',
      university: 'FAST-NUCES',
      year: new Date().getFullYear(),
      question: '',
      q: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      correct: 0,
      explanation: '',
      explain: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (q: Question) => {
    const rawOpts = q.options && q.options.length >= 4 ? q.options : ['', '', '', ''];
    setEditingQuestion({
      ...q,
      question: q.question || q.q || '',
      options: [rawOpts[0] || '', rawOpts[1] || '', rawOpts[2] || '', rawOpts[3] || ''],
      correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : (q.correct ?? 0),
      explanation: q.explanation || q.explain || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion || !user?.email) return;

    setSaving(true);
    try {
      await saveQuestion(user.email, editingQuestion);
      setIsModalOpen(false);
      setEditingQuestion(null);
      await loadData();
    } catch (err) {
      console.error('Failed to save question:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!questionToDelete || !user?.email) return;
    try {
      await deleteQuestion(user.email, questionToDelete.id);
      setQuestionToDelete(null);
      await loadData();
    } catch (err) {
      console.error('Failed to delete question:', err);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-full">
      {/* ─── PAGE HEADER ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-dot text-[24px] sm:text-[28px] font-extrabold text-[var(--text)] tracking-tight">
            Question bank
          </h1>
          <p className="font-heading text-[13px] text-[var(--muted)] mt-1">
            Browse, inspect KaTeX formulas, add new MCQs, or edit existing questions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] border border-[var(--text)] bg-[var(--text)] text-[var(--bg)] text-[13px] font-heading font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus size={15} />
            <span>Add question</span>
          </button>
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-[12px] bg-[var(--card)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[13px] font-heading text-[var(--text)] transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      <AdminDiagnosticBanner
        error={error}
        collectionName="questions"
        onRetry={loadData}
        retrying={loading}
      />

      {/* ─── SEARCH & FILTER TOOLBAR ────────────────────────────────────────── */}
      <div className="p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] flex flex-col gap-3.5">
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-[12px] bg-[var(--card-2)] border border-[var(--border)]">
          <Search size={16} className="text-[var(--muted)] shrink-0" />
          <input
            type="text"
            placeholder="Search by question stem, chapter, or question ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-none text-[13px] font-heading text-[var(--text)] placeholder-[var(--muted)] focus:outline-none"
          />
        </div>

        {/* Filter chips (wrap cleanly, no sideways scroll) */}
        <div className="flex flex-col gap-2 pt-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-heading text-[var(--muted)] mr-1 shrink-0">
              Subject:
            </span>
            <button
              type="button"
              onClick={() => setSubjectFilter('all')}
              className={`text-[12px] font-heading px-2.5 py-1 rounded-full border transition-colors ${
                subjectFilter === 'all'
                  ? 'border-[var(--text)] bg-[var(--text)] text-[var(--bg)] font-semibold'
                  : 'border-[var(--border)] bg-transparent text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              All subjects
            </button>
            {CORE_SUBJECTS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSubjectFilter(s)}
                className={`text-[12px] font-heading px-2.5 py-1 rounded-full border transition-colors ${
                  subjectFilter === s
                    ? 'border-[var(--text)] bg-[var(--text)] text-[var(--bg)] font-semibold'
                    : 'border-[var(--border)] bg-transparent text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-heading text-[var(--muted)] mr-1 shrink-0">
              Difficulty:
            </span>
            {['all', 'Easy', 'Medium', 'Hard'].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDifficultyFilter(d)}
                className={`text-[12px] font-heading px-2.5 py-1 rounded-full border transition-colors ${
                  difficultyFilter === d
                    ? 'border-[var(--text)] bg-[var(--text)] text-[var(--bg)] font-semibold'
                    : 'border-[var(--border)] bg-transparent text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                {d === 'all' ? 'All levels' : d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── QUESTIONS CARDS FEED ────────────────────────────────────────────── */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] space-y-3"
            >
              <div className="h-4 bg-[var(--card-2)] rounded w-1/3" />
              <div className="h-5 bg-[var(--card-2)] rounded w-3/4" />
              <div className="h-10 bg-[var(--card-2)] rounded w-full" />
            </div>
          ))
        ) : questions.length === 0 ? (
          <div className="p-8 rounded-[24px] bg-[var(--card)] border border-[var(--border)] text-center">
            <p className="font-heading text-[14px] text-[var(--muted)]">
              No questions found matching your filter criteria.
            </p>
          </div>
        ) : (
          questions.map((q) => {
            const stem = q.question || q.q || 'Untitled question';
            const options = q.options || [];
            const correctIdx = typeof q.correctAnswer === 'number' ? q.correctAnswer : (q.correct ?? 0);

            return (
              <div
                key={q.id}
                className="p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] flex flex-col gap-3.5"
              >
                {/* Header row: pills + actions */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-heading px-2.5 py-0.5 rounded-full border border-[var(--border)] text-[var(--text)] font-medium">
                      {q.subject || 'General'}
                    </span>
                    {q.chapter && (
                      <span className="text-[11px] font-heading px-2.5 py-0.5 rounded-full border border-[var(--border)] text-[var(--muted)] truncate max-w-[200px]">
                        {q.chapter}
                      </span>
                    )}
                    <span className="text-[11px] font-heading px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--muted)]">
                      {q.difficulty || 'Medium'}
                    </span>
                    {q.university && (
                      <span className="text-[11px] font-heading px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--muted)]">
                        {q.university}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-auto">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(q)}
                      className="p-1.5 rounded-[8px] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors"
                      title="Edit question"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuestionToDelete(q)}
                      className="p-1.5 rounded-[8px] text-[var(--muted)] hover:text-[var(--red)] hover:bg-[var(--surface-hover)] transition-colors"
                      title="Delete question"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Question Stem with KaTeX */}
                <div className="text-[14px] text-[var(--text)] font-heading leading-relaxed">
                  <MathText text={stem} />
                </div>

                {/* Options List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {options.map((opt, idx) => {
                    const isCorrect = idx === correctIdx;
                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-[12px] border text-[13px] font-heading flex items-start gap-2 ${
                          isCorrect
                            ? 'border-[var(--text)] bg-[var(--card-2)] text-[var(--text)] font-medium'
                            : 'border-[var(--border)] bg-transparent text-[var(--muted)]'
                        }`}
                      >
                        <span className="font-heading font-semibold text-[11px] mt-0.5 shrink-0 opacity-70">
                          {String.fromCharCode(65 + idx)}.
                        </span>
                        <div className="min-w-0 flex-1">
                          <MathText text={opt} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation if present */}
                {(q.explanation || q.explain) && (
                  <div className="p-3 rounded-[12px] bg-[var(--card-2)] border border-[var(--border)] text-[12px] font-heading text-[var(--muted)]">
                    <span className="font-semibold text-[var(--text)] block mb-1">Explanation:</span>
                    <MathText text={q.explanation || q.explain || ''} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ─── LOAD MORE BUTTON ────────────────────────────────────────────────── */}
      {hasMore && (
        <div className="flex justify-center pt-2 pb-6">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--surface-hover)] text-sm font-semibold text-[var(--text)] transition-colors cursor-pointer disabled:opacity-50"
          >
            {loadingMore ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Loading more questions…</span>
              </>
            ) : (
              <span>Load More Questions (Next 50)</span>
            )}
          </button>
        </div>
      )}

      {/* ─── ADD / EDIT QUESTION MODAL ───────────────────────────────────────── */}
      {isModalOpen && editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative w-full max-w-[620px] max-h-[90vh] bg-[var(--card)] border border-[var(--border)] rounded-[24px] p-5 sm:p-6 flex flex-col z-10 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] shrink-0">
              <h2 className="font-heading font-bold text-[16px] text-[var(--text)]">
                {editingQuestion.id?.startsWith('q_custom') ? 'Add question' : 'Edit question'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-[var(--muted)] hover:text-[var(--text)]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto space-y-4 py-4 pr-1">
              {/* Subject & Difficulty row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-heading text-[var(--muted)] mb-1">
                    Subject
                  </label>
                  <select
                    value={editingQuestion.subject}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, subject: e.target.value })}
                    className="w-full px-3 py-2 rounded-[12px] bg-[var(--card-2)] border border-[var(--border)] text-[13px] font-heading text-[var(--text)] focus:outline-none"
                  >
                    {CORE_SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-heading text-[var(--muted)] mb-1">
                    Difficulty
                  </label>
                  <select
                    value={editingQuestion.difficulty}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, difficulty: e.target.value })}
                    className="w-full px-3 py-2 rounded-[12px] bg-[var(--card-2)] border border-[var(--border)] text-[13px] font-heading text-[var(--text)] focus:outline-none"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              {/* Chapter & University */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-heading text-[var(--muted)] mb-1">
                    Chapter / Topic
                  </label>
                  <input
                    type="text"
                    value={editingQuestion.chapter || ''}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, chapter: e.target.value })}
                    placeholder="e.g. Vectors & Equilibrium"
                    className="w-full px-3 py-2 rounded-[12px] bg-[var(--card-2)] border border-[var(--border)] text-[13px] font-heading text-[var(--text)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-heading text-[var(--muted)] mb-1">
                    Target university
                  </label>
                  <input
                    type="text"
                    value={editingQuestion.university || ''}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, university: e.target.value })}
                    placeholder="e.g. FAST-NUCES, NUST"
                    className="w-full px-3 py-2 rounded-[12px] bg-[var(--card-2)] border border-[var(--border)] text-[13px] font-heading text-[var(--text)] focus:outline-none"
                  />
                </div>
              </div>

              {/* Question Stem */}
              <div>
                <label className="block text-[11px] font-heading text-[var(--muted)] mb-1">
                  Question text (KaTeX supported with $...$ or $$...$$)
                </label>
                <textarea
                  rows={3}
                  required
                  value={editingQuestion.question || ''}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value, q: e.target.value })}
                  placeholder="Enter MCQ stem..."
                  className="w-full p-3 rounded-[12px] bg-[var(--card-2)] border border-[var(--border)] text-[13px] font-heading text-[var(--text)] focus:outline-none"
                />
              </div>

              {/* 4 Options */}
              <div className="space-y-2">
                <label className="block text-[11px] font-heading text-[var(--muted)]">
                  Answer options & correct choice
                </label>
                {(editingQuestion.options || ['', '', '', '']).map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingQuestion({ ...editingQuestion, correctAnswer: idx, correct: idx })}
                      className={`w-7 h-7 rounded-full border text-[11px] font-heading font-bold shrink-0 flex items-center justify-center transition-colors ${
                        (editingQuestion.correctAnswer ?? editingQuestion.correct) === idx
                          ? 'border-[var(--text)] bg-[var(--text)] text-[var(--bg)]'
                          : 'border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </button>
                    <input
                      type="text"
                      required
                      value={opt}
                      onChange={(e) => {
                        const next = [...(editingQuestion.options || ['', '', '', ''])];
                        next[idx] = e.target.value;
                        setEditingQuestion({ ...editingQuestion, options: next as [string, string, string, string] });
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      className="flex-1 px-3 py-2 rounded-[12px] bg-[var(--card-2)] border border-[var(--border)] text-[13px] font-heading text-[var(--text)] focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              {/* Explanation */}
              <div>
                <label className="block text-[11px] font-heading text-[var(--muted)] mb-1">
                  Explanation / derivation shortcut
                </label>
                <textarea
                  rows={2}
                  value={editingQuestion.explanation || ''}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value, explain: e.target.value })}
                  placeholder="Step-by-step formula or shortcut..."
                  className="w-full p-3 rounded-[12px] bg-[var(--card-2)] border border-[var(--border)] text-[13px] font-heading text-[var(--text)] focus:outline-none"
                />
              </div>

              {/* Modal footer */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-[12px] border border-[var(--border)] text-[13px] font-heading text-[var(--muted)] hover:text-[var(--text)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-[12px] border border-[var(--text)] bg-[var(--text)] text-[var(--bg)] text-[13px] font-heading font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── CONFIRM DELETE QUESTION MODAL ───────────────────────────────────── */}
      {questionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setQuestionToDelete(null)}
          />
          <div className="relative w-full max-w-[400px] rounded-[24px] bg-[var(--card)] border border-[var(--border)] p-6 space-y-4 shadow-2xl">
            <h3 className="font-heading font-bold text-[16px] text-[var(--text)]">
              Delete question?
            </h3>
            <p className="font-heading text-[13px] text-[var(--muted)] leading-relaxed">
              Are you sure you want to remove this question from the active entrance test pool?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setQuestionToDelete(null)}
                className="px-3.5 py-2 rounded-[12px] border border-[var(--border)] text-[13px] font-heading text-[var(--muted)] hover:text-[var(--text)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-[12px] border border-[var(--red)] bg-[var(--red)] text-white text-[13px] font-heading font-semibold"
              >
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminQuestionsPage;

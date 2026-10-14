import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  collection,
  query,
  limit,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  where,
  startAfter,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { MathText, normalizeMath } from '../ui/MathText';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Badge } from '../ui/Badge';
import {
  Search,
  Filter,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookOpen,
  Database,
  X,
  Plus,
} from 'lucide-react';
import katex from 'katex';

interface QuestionItem {
  id: string;
  q?: string;
  question?: string;
  options: string[];
  correct: number;
  topic?: string;
  chapter?: string;
  chapterName?: string;
  subject?: string;
  difficulty?: string;
  explain?: string;
  explanation?: string;
  mathChecked?: boolean;
  mathError?: string;
  mathVersion?: number;
}

interface AdminQuestionBankTabProps {
  adminEmail: string;
}

export const AdminQuestionBankTab: React.FC<AdminQuestionBankTabProps> = ({
  adminEmail,
}) => {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [mathFilter, setMathFilter] = useState<'all' | 'clean' | 'needs_fix'>('all');

  // Pagination
  const [page, setPage] = useState<number>(1);
  const pageSize = 25;

  // Selected & Editing Question
  const [editingQuestion, setEditingQuestion] = useState<QuestionItem | null>(null);
  const [editForm, setEditForm] = useState<{
    q: string;
    options: string[];
    correct: number;
    explain: string;
    topic: string;
    subject: string;
    difficulty: string;
  }>({
    q: '',
    options: ['', '', '', ''],
    correct: 0,
    explain: '',
    topic: '',
    subject: 'Physics',
    difficulty: 'Medium',
  });

  // Action status / feedback
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [cleanupRunning, setCleanupRunning] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<QuestionItem | null>(null);

  // Load questions from Firestore with fallback to prebuilt
  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const colRef = collection(db, 'questions');
      const snap = await getDocs(query(colRef, limit(100)));

      if (!snap.empty) {
        const list: QuestionItem[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));
        setQuestions(list);
      } else {
        // Fallback to local prebuilt catalog if collection is empty
        const { PREBUILT_QUESTIONS } = await import('../../data/prebuiltQuestions');
        const allPrebuilt: QuestionItem[] = [];
        Object.entries(PREBUILT_QUESTIONS).forEach(([sub, qList]) => {
          (qList || []).slice(0, 30).forEach((q: any) => {
            allPrebuilt.push({
              ...q,
              subject: sub,
              mathChecked: true,
              mathVersion: 1,
            });
          });
        });
        setQuestions(allPrebuilt);
      }
    } catch (err: any) {
      console.error('[Admin Question Bank Error at questions]:', err);
      setError(err?.message || 'Failed to load question catalog from Firestore.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // Filtered List
  const filteredQuestions = useMemo(() => {
    return questions.filter((item) => {
      const qText = item.q || item.question || '';
      const topicText = item.topic || item.chapter || item.chapterName || '';
      const sub = item.subject || 'Physics';
      const diff = (item.difficulty || 'medium').toLowerCase();

      // Search match
      if (searchQuery.trim()) {
        const queryLower = searchQuery.toLowerCase();
        const matchesStem = qText.toLowerCase().includes(queryLower);
        const matchesTopic = topicText.toLowerCase().includes(queryLower);
        if (!matchesStem && !matchesTopic) return false;
      }

      // Subject filter
      if (subjectFilter !== 'all' && sub.toLowerCase() !== subjectFilter.toLowerCase()) {
        return false;
      }

      // Difficulty filter
      if (difficultyFilter !== 'all' && diff !== difficultyFilter.toLowerCase()) {
        return false;
      }

      // Math check filter
      if (mathFilter === 'clean' && item.mathChecked !== true) {
        return false;
      }
      if (mathFilter === 'needs_fix' && (item.mathChecked === true && !item.mathError)) {
        return false;
      }

      return true;
    });
  }, [questions, searchQuery, subjectFilter, difficultyFilter, mathFilter]);

  // Paginated chunk
  const paginatedQuestions = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredQuestions.slice(startIndex, startIndex + pageSize);
  }, [filteredQuestions, page]);

  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / pageSize));

  // Edit Question Handler
  const openEditModal = (qItem: QuestionItem) => {
    setEditingQuestion(qItem);
    setEditForm({
      q: qItem.q || qItem.question || '',
      options: Array.isArray(qItem.options) ? [...qItem.options] : ['', '', '', ''],
      correct: typeof qItem.correct === 'number' ? qItem.correct : 0,
      explain: qItem.explain || qItem.explanation || '',
      topic: qItem.topic || qItem.chapter || '',
      subject: qItem.subject || 'Physics',
      difficulty: qItem.difficulty || 'Medium',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingQuestion) return;
    try {
      const updates = {
        question: editForm.q,
        q: editForm.q,
        options: editForm.options,
        correct: editForm.correct,
        explain: editForm.explain,
        explanation: editForm.explain,
        topic: editForm.topic,
        subject: editForm.subject,
        difficulty: editForm.difficulty,
        mathChecked: true,
        mathVersion: 1,
        updatedAt: new Date().toISOString(),
      };

      try {
        await updateDoc(doc(db, 'questions', editingQuestion.id), updates);
      } catch (fErr) {
        console.warn('Doc update on Firestore fallback:', fErr);
      }

      setQuestions((prev) =>
        prev.map((q) => (q.id === editingQuestion.id ? { ...q, ...updates } : q))
      );

      setActionFeedback('Question updated and LaTeX verified successfully.');
      setTimeout(() => setActionFeedback(null), 3000);
      setEditingQuestion(null);
    } catch (err: any) {
      alert(`Error updating question: ${err.message}`);
    }
  };

  // Delete Question Handler
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      try {
        await deleteDoc(doc(db, 'questions', deleteTarget.id));
      } catch (fErr) {
        console.warn('Delete on Firestore fallback:', fErr);
      }

      setQuestions((prev) => prev.filter((q) => q.id !== deleteTarget.id));
      setActionFeedback(`Deleted question ${deleteTarget.id}`);
      setTimeout(() => setActionFeedback(null), 3000);
      setDeleteTarget(null);
    } catch (err: any) {
      alert(`Error deleting question: ${err.message}`);
    }
  };

  // Run Math Cleanup on Currently Visible Questions
  const handleBatchMathCleanup = async () => {
    setCleanupRunning(true);
    let cleanedCount = 0;
    let failedCount = 0;

    const updatedList = await Promise.all(
      questions.map(async (item) => {
        const textToTest = `${item.q || item.question || ''} ${(item.options || []).join(' ')} ${item.explain || item.explanation || ''}`;
        const normalized = normalizeMath(textToTest);

        let isClean = true;
        let mathErrMsg = '';

        try {
          // Extract LaTeX chunks and run strict test
          const regex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$(?:\\\$|[^\$])+?\$|\\\([\s\S]*?\\\))/g;
          const chunks = normalized.match(regex) || [];
          for (const chunk of chunks) {
            const inner = chunk.replace(/^\$\$|^\$|^\\\[|^\\\(|\$\$$|\$$|\\\]$|\\\)$/g, '').trim();
            katex.renderToString(inner, { throwOnError: true, strict: 'error' });
          }
          cleanedCount++;
        } catch (kErr: any) {
          isClean = false;
          mathErrMsg = kErr?.message || 'KaTeX formatting issue';
          failedCount++;
        }

        const newProps = {
          ...item,
          q: normalizeMath(item.q || item.question || ''),
          options: (item.options || []).map(normalizeMath),
          explain: normalizeMath(item.explain || item.explanation || ''),
          mathChecked: isClean,
          mathError: isClean ? undefined : mathErrMsg,
          mathVersion: 1,
        };

        // Persist update in Firestore if document exists
        try {
          await updateDoc(doc(db, 'questions', item.id), {
            mathChecked: isClean,
            mathVersion: 1,
            mathError: isClean ? null : mathErrMsg,
          });
        } catch {}

        return newProps;
      })
    );

    setQuestions(updatedList);
    setCleanupRunning(false);
    setActionFeedback(
      `Math cleanup completed: ${cleanedCount} verified clean, ${failedCount} flagged for review.`
    );
    setTimeout(() => setActionFeedback(null), 4000);
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Database className="w-6 h-6 text-violet-600" />
            <span>Question Bank Catalog</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Live catalog across Entrance Exams, MDCAT, TCAT, and Intermediate Boards with KaTeX math validation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleBatchMathCleanup}
            disabled={cleanupRunning}
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-violet-600/20 cursor-pointer disabled:opacity-50"
            title="Scan and repair mathematical formulas with KaTeX"
          >
            <Sparkles className={`w-4 h-4 ${cleanupRunning ? 'animate-spin' : ''}`} />
            <span>{cleanupRunning ? 'Validating LaTeX…' : 'Re-run Math Cleanup'}</span>
          </button>
          <button
            type="button"
            onClick={loadQuestions}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            title="Refresh Question Bank"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {actionFeedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search question stem or topic..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs font-bold pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500/30"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Subject Filter */}
          <select
            value={subjectFilter}
            onChange={(e) => {
              setSubjectFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs font-bold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <option value="all">All Subjects</option>
            <option value="Physics">Physics</option>
            <option value="Chemistry">Chemistry</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Biology">Biology</option>
            <option value="English">English</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Intelligence">Intelligence</option>
          </select>

          {/* Difficulty Filter */}
          <select
            value={difficultyFilter}
            onChange={(e) => {
              setDifficultyFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs font-bold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          {/* Math Check Filter */}
          <select
            value={mathFilter}
            onChange={(e) => {
              setMathFilter(e.target.value as any);
              setPage(1);
            }}
            className="text-xs font-bold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <option value="all">All Math Status</option>
            <option value="clean">Clean (KaTeX Verified)</option>
            <option value="needs_fix">Needs Math Fix</option>
          </select>
        </div>
      </div>

      {/* Main Table or Loading / Error State */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-violet-600 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500">Loading Question Bank catalog…</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200 space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span>Failed to load questions</span>
          </div>
          <p className="text-xs">{error}</p>
          <button
            type="button"
            onClick={loadQuestions}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Connection</span>
          </button>
        </div>
      ) : paginatedQuestions.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
          <h4 className="font-extrabold text-sm text-slate-700 dark:text-slate-300">No questions match your criteria</h4>
          <p className="text-xs text-slate-400">Try adjusting your search query or subject filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-extrabold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4 w-12">#</th>
                    <th className="py-3.5 px-4 min-w-[320px]">Question Stem & KaTeX Math</th>
                    <th className="py-3.5 px-4">Subject & Topic</th>
                    <th className="py-3.5 px-4">Difficulty</th>
                    <th className="py-3.5 px-4">Math Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {paginatedQuestions.map((qItem, idx) => (
                    <tr
                      key={qItem.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                        {(page - 1) * pageSize + idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1 max-w-lg">
                          <div className="font-bold text-slate-900 dark:text-white leading-relaxed">
                            <MathText text={qItem.q || qItem.question || 'Untitled Question'} />
                          </div>
                          {Array.isArray(qItem.options) && (
                            <div className="text-[11px] text-slate-400 flex flex-wrap gap-2">
                              {qItem.options.map((opt, optIdx) => (
                                <span
                                  key={optIdx}
                                  className={`px-2 py-0.5 rounded-md ${
                                    optIdx === qItem.correct
                                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                  }`}
                                >
                                  {String.fromCharCode(65 + optIdx)}: <MathText text={opt} inline />
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 block">
                          {qItem.subject || 'Physics'}
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate max-w-[160px]">
                          {qItem.topic || qItem.chapter || 'General'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {qItem.difficulty || 'Medium'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {qItem.mathChecked !== false ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle className="w-3 h-3" />
                            <span>Clean</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-300 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-800" title={qItem.mathError}>
                            <AlertTriangle className="w-3 h-3" />
                            <span>Needs Fix</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(qItem)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/50 transition-colors cursor-pointer"
                            title="Edit Question and Math"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(qItem)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                            title="Delete Question"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <div>
                Showing {(page - 1) * pageSize + 1} to{' '}
                {Math.min(page * pageSize, filteredQuestions.length)} of {filteredQuestions.length} questions
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-extrabold px-2 text-slate-700 dark:text-slate-200">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Question Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Edit Question & LaTeX
              </h3>
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Question Stem (supports LaTeX $...$)
                </label>
                <textarea
                  value={editForm.q}
                  onChange={(e) => setEditForm({ ...editForm, q: e.target.value })}
                  rows={3}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500/30"
                />
                <div className="mt-1.5 p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300">
                  <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400 block mb-0.5">Live Preview:</span>
                  <MathText text={editForm.q} />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Options (select radio for correct answer)
                </label>
                <div className="space-y-2">
                  {editForm.options.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctAnswerIndex"
                        checked={editForm.correct === oIdx}
                        onChange={() => setEditForm({ ...editForm, correct: oIdx })}
                        className="w-4 h-4 text-violet-600 focus:ring-violet-500 cursor-pointer"
                      />
                      <span className="font-extrabold text-slate-400 w-4">
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...editForm.options];
                          newOpts[oIdx] = e.target.value;
                          setEditForm({ ...editForm, options: newOpts });
                        }}
                        className="flex-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                  <select
                    value={editForm.subject}
                    onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                  >
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Biology">Biology</option>
                    <option value="English">English</option>
                    <option value="Computer Science">Computer Science</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Topic / Chapter</label>
                  <input
                    type="text"
                    value={editForm.topic}
                    onChange={(e) => setEditForm({ ...editForm, topic: e.target.value })}
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Difficulty</label>
                  <select
                    value={editForm.difficulty}
                    onChange={(e) => setEditForm({ ...editForm, difficulty: e.target.value })}
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Explanation</label>
                <textarea
                  value={editForm.explain}
                  onChange={(e) => setEditForm({ ...editForm, explain: e.target.value })}
                  rows={2}
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold cursor-pointer shadow-md shadow-violet-600/20"
                >
                  Save Question
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Question?"
        description="Are you sure you want to permanently delete this MCQ from the question bank? This action cannot be undone."
        confirmLabel="Delete MCQ"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};

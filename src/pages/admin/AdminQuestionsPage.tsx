import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Database,
  Sparkles,
  RefreshCw,
  Eye,
  X,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { MathText } from '@/components/ui/MathText';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  fetchQuestions,
  saveQuestion,
  deleteQuestion,
  seedBalancedMCQPool,
} from '@/services/adminService';
import type { Question } from '@/types';

export function AdminQuestionsPage() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [univFilter, setUnivFilter] = useState('all');
  const [diffFilter, setDiffFilter] = useState('all');

  // Modal states
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Seeder progress
  const [seeding, setSeeding] = useState(false);
  const [seedProgress, setSeedProgress] = useState<{ done: number; total: number } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchQuestions({
        search,
        subject: subjectFilter,
        university: univFilter,
        difficulty: diffFilter,
        limitCount: 100,
      });
      setQuestions(data);
    } catch (err) {
      console.error('Failed to load questions:', err);
    } finally {
      setLoading(false);
    }
  }, [search, subjectFilter, univFilter, diffFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadData]);

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
      mathChecked: true,
      needsMathFix: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (q: Question) => {
    setEditingQuestion({
      ...q,
      question: q.question || q.q || '',
      options: (q.options && q.options.length >= 4 ? q.options : ['', '', '', '']) as [string, string, string, string],
      correctAnswer: q.correctAnswer ?? q.correct ?? 0,
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

  const handleDeleteConfirm = async () => {
    if (!deletingId || !user?.email) return;
    try {
      await deleteQuestion(user.email, deletingId);
      setDeletingId(null);
      await loadData();
    } catch (err) {
      console.error('Failed to delete question:', err);
    }
  };

  const handleSeed = async () => {
    if (!user?.email) return;
    setSeeding(true);
    setSeedProgress({ done: 0, total: 500 });
    try {
      await seedBalancedMCQPool(user.email, (done, total) => {
        setSeedProgress({ done, total });
      });
      await loadData();
    } catch (err) {
      console.error('Seeding error:', err);
    } finally {
      setSeeding(false);
      setSeedProgress(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Database size={20} style={{ color: '#10B981' }} />
            <h1
              className="font-display"
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: 'var(--text)',
                letterSpacing: '-0.02em',
              }}
            >
              Question Bank Management
            </h1>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Inspect, author, and preview KaTeX formulas across the Pakistani university entrance test pool.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSeed}
            loading={seeding}
            style={{
              borderColor: 'rgba(16,185,129,0.3)',
              color: '#34D399',
            }}
          >
            <Sparkles size={14} /> Ensure 500+ Pool
          </Button>
          <Button variant="primary" size="sm" onClick={handleOpenAdd}>
            <Plus size={14} /> Add Question
          </Button>
        </div>
      </div>

      {/* Seeding Progress Bar */}
      {seedProgress && (
        <GlassCard style={{ padding: 16, border: '1px solid rgba(16,185,129,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
            <span style={{ color: 'var(--text)' }}>Writing 500+ balanced questions to Firestore...</span>
            <span style={{ color: '#34D399', fontWeight: 700 }}>
              {seedProgress.done} / {seedProgress.total}
            </span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${(seedProgress.done / seedProgress.total) * 100}%`,
                background: 'linear-gradient(90deg, #10B981, #34D399)',
                transition: 'width 200ms ease',
              }}
            />
          </div>
        </GlassCard>
      )}

      {/* ── Toolbar & Filters ────────────────────────────────────────── */}
      <GlassCard style={{ padding: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <div
            style={{
              flex: 1,
              minWidth: 240,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-input)',
              padding: '0 12px',
            }}
          >
            <Search size={16} style={{ color: 'var(--text-faint)' }} />
            <input
              type="text"
              placeholder="Search question stems, chapters, or IDs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: 'var(--text)',
                fontSize: 13,
                padding: '10px 0',
                outline: 'none',
              }}
            />
          </div>

          {/* Subject Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={14} style={{ color: 'var(--text-faint)' }} />
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                borderRadius: 'var(--r-input)',
                padding: '8px 12px',
                fontSize: 13,
                outline: 'none',
              }}
            >
              <option value="all">All Subjects</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Computer Science">Computer Science</option>
              <option value="English">English</option>
              <option value="Analytical">Analytical / IQ</option>
            </select>
          </div>

          {/* University Filter */}
          <select
            value={univFilter}
            onChange={(e) => setUnivFilter(e.target.value)}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              borderRadius: 'var(--r-input)',
              padding: '8px 12px',
              fontSize: 13,
              outline: 'none',
            }}
          >
            <option value="all">All Universities</option>
            <option value="FAST-NUCES">FAST-NUCES</option>
            <option value="NUST NET">NUST NET</option>
            <option value="GIKI">GIKI</option>
            <option value="LUMS">LUMS</option>
            <option value="NED/UET/COMSATS">NED/UET/COMSATS</option>
          </select>

          {/* Difficulty Filter */}
          <select
            value={diffFilter}
            onChange={(e) => setDiffFilter(e.target.value)}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              borderRadius: 'var(--r-input)',
              padding: '8px 12px',
              fontSize: 13,
              outline: 'none',
            }}
          >
            <option value="all">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          <Button variant="ghost" size="sm" onClick={loadData}>
            <RefreshCw size={14} />
          </Button>
        </div>
      </GlassCard>

      {/* ── Question List ────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <GlassCard key={i}>
              <Skeleton height={20} width="30%" />
              <div style={{ marginTop: 12 }}><Skeleton height={16} count={2} /></div>
            </GlassCard>
          ))}
        </div>
      ) : questions.length === 0 ? (
        <GlassCard>
          <EmptyState
            title="No questions found"
            description="Try adjusting your search criteria or click 'Ensure 500+ Pool' to seed the balanced entrance exam question bank."
          />
        </GlassCard>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {questions.map((q) => {
            const stem = q.question || q.q || '';
            const opts = q.options || [];
            const correctIdx = q.correctAnswer ?? q.correct ?? 0;
            const explanation = q.explanation || q.explain || '';

            return (
              <GlassCard key={q.id} style={{ padding: '20px' }}>
                {/* Meta row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <code style={{ fontSize: 11, color: 'var(--text-faint)', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4 }}>
                      {q.id}
                    </code>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: 'rgba(47,107,255,0.15)',
                        color: '#60A5FA',
                      }}
                    >
                      {q.subject}
                    </span>
                    {q.chapter && (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        • {q.chapter}
                      </span>
                    )}
                    {q.university && (
                      <span style={{ fontSize: 11, color: 'var(--text-faint)', border: '1px solid var(--border)', padding: '1px 6px', borderRadius: 4 }}>
                        {q.university}
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: q.difficulty === 'Hard' ? 'var(--danger)' : q.difficulty === 'Medium' ? 'var(--warning)' : 'var(--success)',
                      }}
                    >
                      {q.difficulty}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(q)}>
                      <Edit2 size={13} /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingId(q.id)}
                      style={{ color: 'var(--danger)' }}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>

                {/* Question Stem with KaTeX */}
                <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', marginBottom: 14 }}>
                  <MathText>{stem}</MathText>
                </div>

                {/* Options Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  {opts.map((opt, idx) => {
                    const isCorrect = idx === correctIdx;
                    return (
                      <div
                        key={idx}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 'var(--r-input)',
                          fontSize: 13,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          background: isCorrect ? 'rgba(52,211,153,0.12)' : 'var(--surface)',
                          border: isCorrect ? '1px solid rgba(52,211,153,0.3)' : '1px solid var(--border)',
                          color: isCorrect ? '#34D399' : 'var(--text-muted)',
                        }}
                      >
                        <span style={{ fontWeight: 700, fontSize: 11, width: 16 }}>
                          {String.fromCharCode(65 + idx)}.
                        </span>
                        <div style={{ flex: 1 }}>
                          <MathText>{String(opt)}</MathText>
                        </div>
                        {isCorrect && <Check size={14} style={{ color: '#34D399' }} />}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {explanation && (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--r-input)',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      fontSize: 12,
                      color: 'var(--text-muted)',
                    }}
                  >
                    <strong style={{ color: 'var(--text)' }}>Derivation: </strong>
                    <MathText>{explanation}</MathText>
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* ── Add / Edit Question Modal with Live KaTeX Preview ────────── */}
      {isModalOpen && editingQuestion && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 110,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(6px)',
            }}
            onClick={() => setIsModalOpen(false)}
          />

          <div
            className="glass"
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 720,
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: 'var(--r-card)',
              background: 'var(--bg-2)',
              border: '1px solid var(--border)',
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              zIndex: 111,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>
                {editingQuestion.id.startsWith('q_custom_') ? 'Author New Question' : 'Edit Question'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Row 1: Subject, Chapter, University, Difficulty */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase' }}>
                    Subject
                  </label>
                  <select
                    value={editingQuestion.subject}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, subject: e.target.value })}
                    style={{
                      width: '100%',
                      padding: 8,
                      borderRadius: 8,
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                      marginTop: 4,
                    }}
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="English">English</option>
                    <option value="Analytical">Analytical / IQ</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase' }}>
                    Chapter
                  </label>
                  <input
                    type="text"
                    value={editingQuestion.chapter || ''}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, chapter: e.target.value })}
                    placeholder="e.g. Differentiation"
                    style={{
                      width: '100%',
                      padding: 8,
                      borderRadius: 8,
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                      marginTop: 4,
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase' }}>
                    University
                  </label>
                  <select
                    value={editingQuestion.university || 'FAST-NUCES'}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, university: e.target.value })}
                    style={{
                      width: '100%',
                      padding: 8,
                      borderRadius: 8,
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                      marginTop: 4,
                    }}
                  >
                    <option value="FAST-NUCES">FAST-NUCES</option>
                    <option value="NUST NET">NUST NET</option>
                    <option value="GIKI">GIKI</option>
                    <option value="LUMS">LUMS</option>
                    <option value="NED/UET/COMSATS">NED/UET/COMSATS</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase' }}>
                    Difficulty
                  </label>
                  <select
                    value={editingQuestion.difficulty}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, difficulty: e.target.value })}
                    style={{
                      width: '100%',
                      padding: 8,
                      borderRadius: 8,
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                      marginTop: 4,
                    }}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              {/* Question Stem */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase' }}>
                  Question Stem (supports KaTeX $...$)
                </label>
                <textarea
                  rows={3}
                  value={editingQuestion.question || ''}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value, q: e.target.value })}
                  placeholder="e.g. Evaluate $\int_0^{\pi/2} \sin(x) dx$"
                  required
                  style={{
                    width: '100%',
                    padding: 10,
                    borderRadius: 8,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    marginTop: 4,
                    fontSize: 14,
                    fontFamily: 'monospace',
                  }}
                />
              </div>

              {/* Real-time KaTeX preview of Stem */}
              {editingQuestion.question && (
                <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px dashed var(--border)' }}>
                  <div style={{ fontSize: 10, color: '#34D399', fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Eye size={12} /> Live Rendered Preview
                  </div>
                  <MathText>{editingQuestion.question}</MathText>
                </div>
              )}

              {/* Options A..D */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
                  Options (Select the correct radio button)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  {[0, 1, 2, 3].map((idx) => {
                    const optVal = editingQuestion.options[idx] || '';
                    const isCorrect = (editingQuestion.correctAnswer ?? 0) === idx;

                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: 8,
                          borderRadius: 8,
                          background: isCorrect ? 'rgba(52,211,153,0.1)' : 'var(--surface)',
                          border: isCorrect ? '1px solid #34D399' : '1px solid var(--border)',
                        }}
                      >
                        <input
                          type="radio"
                          name="correctOpt"
                          checked={isCorrect}
                          onChange={() => setEditingQuestion({ ...editingQuestion, correctAnswer: idx as 0 | 1 | 2 | 3, correct: idx })}
                        />
                        <span style={{ fontWeight: 700, fontSize: 12 }}>{String.fromCharCode(65 + idx)}.</span>
                        <input
                          type="text"
                          value={optVal}
                          onChange={(e) => {
                            const newOpts = [...editingQuestion.options] as [string, string, string, string];
                            newOpts[idx] = e.target.value;
                            setEditingQuestion({ ...editingQuestion, options: newOpts });
                          }}
                          placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                          required
                          style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text)',
                            fontSize: 13,
                            outline: 'none',
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Explanation */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase' }}>
                  Step-by-step Solution / Explanation
                </label>
                <textarea
                  rows={2}
                  value={editingQuestion.explanation || ''}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value, explain: e.target.value })}
                  placeholder="Derivation steps with KaTeX formulas..."
                  style={{
                    width: '100%',
                    padding: 8,
                    borderRadius: 8,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    marginTop: 4,
                    fontSize: 13,
                    fontFamily: 'monospace',
                  }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <Button variant="secondary" size="md" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="md" type="submit" loading={saving}>
                  Save Question
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Dialog ───────────────────────────────── */}
      {deletingId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
            }}
            onClick={() => setDeletingId(null)}
          />
          <div
            className="glass"
            style={{
              position: 'relative',
              maxWidth: 400,
              width: '100%',
              padding: 24,
              borderRadius: 'var(--r-card)',
              background: 'var(--bg-2)',
              border: '1px solid rgba(248,113,113,0.3)',
              textAlign: 'center',
              zIndex: 121,
            }}
          >
            <AlertTriangle size={36} style={{ color: 'var(--danger)', margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
              Delete Question?
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              Are you sure you want to permanently delete document <code style={{ color: 'var(--danger)' }}>{deletingId}</code>? This action will be recorded in audit logs.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <Button variant="secondary" size="md" onClick={() => setDeletingId(null)}>
                Cancel
              </Button>
              <Button variant="danger" size="md" onClick={handleDeleteConfirm}>
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

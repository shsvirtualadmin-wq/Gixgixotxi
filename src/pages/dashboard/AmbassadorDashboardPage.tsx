import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import {
  Users,
  Copy,
  Check,
  Share2,
  Calendar,
  Sparkles,
  Trophy,
  Plus,
  FileText,
  Upload,
  Globe,
  Lock,
  Trash2,
  Eye,
  AlertCircle,
  Clock,
  Download,
  CheckCircle2,
} from 'lucide-react';
import {
  getAmbassadorDashboardData,
  type AmbassadorStats,
} from '@/services/referralService';
import {
  createAmbassadorTest,
  deleteAmbassadorTest,
  togglePublishAmbassadorTest,
  getAmbassadorTestsForCreator,
  getTestAttemptsForCreator,
  type AmbassadorTestDoc,
  type AmbassadorQuestion,
  type GrandLineAttempt,
} from '@/services/ambassadorTestService';
import { GRAND_LINE_NAME, NAKAMA_CAPTAIN_SINGULAR } from '@/constants/branding';

const SUBJECT_OPTIONS = [
  { value: 'mathematics', label: 'Mathematics' },
  { value: 'physics', label: 'Physics' },
  { value: 'chemistry', label: 'Chemistry' },
  { value: 'biology', label: 'Biology' },
  { value: 'english', label: 'English' },
  { value: 'computer-science', label: 'Computer Science' },
  { value: 'intelligence', label: 'Intelligence / Analytical' },
];

const QUESTION_COUNT_OPTIONS = [10, 20, 30, 40, 50] as const;

export function AmbassadorDashboardPage() {
  const { user } = useAuth();
  const { profile } = useUserProfile();

  const [stats, setStats] = useState<AmbassadorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  // Ambassador Tests State
  const [tests, setTests] = useState<AmbassadorTestDoc[]>([]);
  const [loadingTests, setLoadingTests] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Test Creator Form State
  const [testTitle, setTestTitle] = useState('');
  const [subject, setSubject] = useState('mathematics');
  const [questionCount, setQuestionCount] = useState<10 | 20 | 30 | 40 | 50>(10);
  const [isPublic, setIsPublic] = useState(true);
  const [csvText, setCsvText] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState<AmbassadorQuestion[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [submittingTest, setSubmittingTest] = useState(false);

  // Attempts Modal for specific test
  const [viewingAttemptsTest, setViewingAttemptsTest] = useState<AmbassadorTestDoc | null>(null);
  const [testAttempts, setTestAttempts] = useState<GrandLineAttempt[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);

  // Load ambassador data
  const loadStats = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getAmbassadorDashboardData(user.uid);
      setStats(data);
    } catch (err) {
      console.warn('[AmbassadorDashboard] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadTests = useCallback(async () => {
    if (!user) return;
    setLoadingTests(true);
    try {
      const data = await getAmbassadorTestsForCreator(user.uid);
      setTests(data);
    } catch (err) {
      console.warn('[AmbassadorDashboard] Error loading tests:', err);
    } finally {
      setLoadingTests(false);
    }
  }, [user]);

  useEffect(() => {
    loadStats();
    loadTests();
  }, [loadStats, loadTests]);

  const shortId = stats?.shortId || profile?.shortId || user?.uid.slice(0, 5) || '00000';
  const referralLink = `${window.location.origin}/signup?ref=${shortId}`;
  const shareMessage = `Join Boardly — Pakistan's #1 Entrance Exam Prep Platform (FAST, NUST, MDCAT, GIKI, ECAT)! Use my official ${NAKAMA_CAPTAIN_SINGULAR} code #${shortId} or link to register: ${referralLink}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(shortId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2500);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(shareMessage);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // CSV Parsing and validation (same format as admin CSV import)
  const handleParseCsv = (text: string) => {
    setCsvText(text);
    setParseErrors([]);
    setParsedQuestions([]);

    if (!text.trim()) return;

    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      setParseErrors(['CSV must have at least 1 header row and 1 question row.']);
      return;
    }

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          if (inQuotes && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (c === ',' && !inQuotes) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += c;
        }
      }
      result.push(cur.trim());
      return result;
    };

    const header = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9_]/g, ''));
    const errors: string[] = [];
    const questions: AmbassadorQuestion[] = [];

    for (let i = 1; i < lines.length; i++) {
      const rowNum = i + 1;
      const row = parseLine(lines[i]);
      if (row.length < 5) {
        errors.push(`Row ${rowNum}: Insufficient columns (expected question, 4 options, and correct index).`);
        continue;
      }

      const getCol = (name: string): string => {
        const idx = header.indexOf(name);
        return idx !== -1 && row[idx] !== undefined ? row[idx] : '';
      };

      const q = getCol('question') || getCol('q') || row[3] || '';
      const optA = getCol('option_a') || getCol('optiona') || getCol('opt1') || row[4] || '';
      const optB = getCol('option_b') || getCol('optionb') || getCol('opt2') || row[5] || '';
      const optC = getCol('option_c') || getCol('optionc') || getCol('opt3') || row[6] || '';
      const optD = getCol('option_d') || getCol('optiond') || getCol('opt4') || row[7] || '';
      const rawCorrect = getCol('correct') || getCol('correct_answer') || row[8] || '0';
      const explain = getCol('explanation') || getCol('explain') || row[9] || '';
      const ch = getCol('chapter') || '';
      const diff = ((getCol('difficulty') || 'medium').toLowerCase()) as 'easy' | 'medium' | 'hard';

      if (!q.trim()) {
        errors.push(`Row ${rowNum}: Question text is missing.`);
        continue;
      }
      if (!optA || !optB || !optC || !optD) {
        errors.push(`Row ${rowNum}: Missing one or more of the 4 required options (A, B, C, D).`);
        continue;
      }

      let correctIdx = 0;
      if (/^[0-3]$/.test(rawCorrect.trim())) {
        correctIdx = parseInt(rawCorrect.trim(), 10);
      } else if (/^[a-dA-D]$/.test(rawCorrect.trim())) {
        correctIdx = rawCorrect.trim().toUpperCase().charCodeAt(0) - 65;
      } else {
        errors.push(`Row ${rowNum}: Invalid correct option '${rawCorrect}' (must be 0-3 or A-D).`);
        continue;
      }

      questions.push({
        id: `amb-q-${i}`,
        subject,
        chapter: ch,
        difficulty: diff,
        q: q.trim(),
        options: [optA.trim(), optB.trim(), optC.trim(), optD.trim()],
        correct: correctIdx,
        explanation: explain.trim() || 'Correct answer verified.',
      });
    }

    if (errors.length > 0) {
      setParseErrors(errors);
    }
    setParsedQuestions(questions);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleParseCsv(content);
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const headers = ['subject', 'chapter', 'difficulty', 'question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct', 'explanation'];
    const row1 = ['mathematics', 'Integration', 'medium', '"Evaluate integral of x*cos(x) dx"', '"x*sin(x) + cos(x) + C"', '"x*sin(x) - cos(x) + C"', '"-x*cos(x) + C"', '"x^2 + C"', '0', '"Apply integration by parts."'];
    const row2 = ['physics', 'Vectors', 'easy', '"If A . B = 0, the two vectors are:"', '"Parallel"', '"Perpendicular"', '"Antiparallel"', '"Zero vectors"', '1', '"Dot product of orthogonal vectors is zero."'];
    const content = [headers.join(','), row1.join(','), row2.join(',')].join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'ambassador_mcq_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCreateTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || submittingTest) return;

    if (!testTitle.trim()) {
      alert('Please enter a test title.');
      return;
    }
    if (parsedQuestions.length < questionCount) {
      alert(`This test requires ${questionCount} questions, but only ${parsedQuestions.length} valid questions were parsed from the CSV.`);
      return;
    }

    setSubmittingTest(true);
    try {
      const selectedSlice = parsedQuestions.slice(0, questionCount);
      await createAmbassadorTest({
        title: testTitle.trim(),
        subject,
        questionCount,
        questions: selectedSlice,
        isPublic,
        creatorUid: user.uid,
        creatorName: profile?.displayName || user.displayName || NAKAMA_CAPTAIN_SINGULAR,
        creatorShortId: shortId,
        creatorEmail: user.email || '',
      });

      setShowCreateModal(false);
      setTestTitle('');
      setCsvText('');
      setParsedQuestions([]);
      setParseErrors([]);
      await loadTests();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create test');
    } finally {
      setSubmittingTest(false);
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (!user) return;
    if (!confirm('Are you sure you want to delete this test? All its attempt records will also be removed.')) return;
    try {
      await deleteAmbassadorTest(testId, user.uid);
      await loadTests();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete test');
    }
  };

  const handleTogglePublish = async (test: AmbassadorTestDoc) => {
    if (!user) return;
    try {
      await togglePublishAmbassadorTest(test.id, !test.isPublic, user.uid);
      await loadTests();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update test status');
    }
  };

  const handleViewAttempts = async (test: AmbassadorTestDoc) => {
    setViewingAttemptsTest(test);
    setLoadingAttempts(true);
    try {
      const attempts = await getTestAttemptsForCreator(test.id);
      setTestAttempts(attempts);
    } catch (err) {
      console.warn('Error loading attempts:', err);
    } finally {
      setLoadingAttempts(false);
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24, padding: '1rem' }}>
      {/* ── Header & Ambassador Status Banner ── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge color="red">Official Role</Badge>
          <span className="text-xs font-mono uppercase text-[var(--accent)] font-bold">
            Program Period Active · Pro Unlocked
          </span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text)] tracking-tight">
          {NAKAMA_CAPTAIN_SINGULAR} Cockpit
        </h1>
        <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
          Represent Boardly across colleges and coaching circles. Share your unique invite ID, track referred students in real-time, earn bonus Pro weeks, and author public {GRAND_LINE_NAME} mocks.
        </p>
      </div>

      {loading ? (
        <Skeleton height={140} />
      ) : (
        <>
          {/* ── Key Metrics Cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <GlassCard style={{ padding: '16px' }}>
              <div className="flex items-center justify-between text-[var(--muted)] mb-1">
                <span className="text-[11px] font-mono uppercase">Total Enrolled</span>
                <Users size={16} className="text-[#D71921]" />
              </div>
              <span className="text-2xl font-display font-bold text-[var(--text)]">
                {stats?.totalReferrals ?? 0}
              </span>
              <span className="text-[10px] text-[var(--text-faint)] block mt-0.5">Students brought</span>
            </GlassCard>

            <GlassCard style={{ padding: '16px' }}>
              <div className="flex items-center justify-between text-[var(--muted)] mb-1">
                <span className="text-[11px] font-mono uppercase">Pro Reward</span>
                <Sparkles size={16} className="text-amber-400" />
              </div>
              <span className="text-2xl font-display font-bold text-[var(--text)]">
                +{stats?.bonusWeeksEarned ?? 0} Wks
              </span>
              <span className="text-[10px] text-[var(--text-faint)] block mt-0.5">1 week per student</span>
            </GlassCard>

            <GlassCard style={{ padding: '16px' }}>
              <div className="flex items-center justify-between text-[var(--muted)] mb-1">
                <span className="text-[11px] font-mono uppercase">This Month</span>
                <Calendar size={16} className="text-emerald-400" />
              </div>
              <span className="text-2xl font-display font-bold text-[var(--text)]">
                {stats?.thisMonth ?? 0}
              </span>
              <span className="text-[10px] text-[var(--text-faint)] block mt-0.5">
                {stats?.thisWeek ?? 0} this week
              </span>
            </GlassCard>

            <GlassCard style={{ padding: '16px' }}>
              <div className="flex items-center justify-between text-[var(--muted)] mb-1">
                <span className="text-[11px] font-mono uppercase">National Rank</span>
                <Trophy size={16} className="text-yellow-400" />
              </div>
              <span className="text-2xl font-display font-bold text-[var(--text)]">
                #{stats?.rank ?? 1}
              </span>
              <span className="text-[10px] text-[var(--text-faint)] block mt-0.5">Among Captains</span>
            </GlassCard>
          </div>

          {/* ── Referral Link & Short ID Section ── */}
          <GlassCard style={{ padding: '24px' }}>
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-[var(--text)] font-display">
                  Your Personal Referral Link &amp; Short ID
                </h3>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  When new students sign up using your link or 5-digit code, you are permanently recorded as their referrer.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--muted)] font-mono">Short ID:</span>
                <span className="font-mono text-sm font-bold text-[#D71921] px-2.5 py-1 rounded bg-[var(--surface-2)] border border-[var(--border)]">
                  #{shortId}
                </span>
                <button
                  onClick={handleCopyId}
                  className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[var(--text)] cursor-pointer"
                  title="Copy Short ID"
                >
                  {copiedId ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4">
              <input
                type="text"
                readOnly
                value={referralLink}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs sm:text-sm font-mono text-[var(--text)] select-all"
              />
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="secondary" size="sm" onClick={handleCopyLink} className="flex-1 sm:flex-none">
                  {copiedLink ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  <span>{copiedLink ? 'Copied Link' : 'Copy Link'}</span>
                </Button>
                <Button variant="primary" size="sm" onClick={handleWhatsAppShare} className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700">
                  <Share2 size={14} />
                  <span>Share on WhatsApp</span>
                </Button>
              </div>
            </div>

            {/* Ready-made Share SHS section */}
            <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-mono uppercase text-[var(--text-faint)]">
                  Ready-Made Share Message:
                </span>
                <button
                  onClick={handleCopyMessage}
                  className="text-xs font-bold text-[var(--accent)] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedMessage ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                  <span>{copiedMessage ? 'Copied Message!' : 'Copy Message'}</span>
                </button>
              </div>
              <p className="text-xs text-[var(--muted)] leading-relaxed italic bg-[var(--surface-2)] p-2.5 rounded-lg border border-[var(--border)]">
                "{shareMessage}"
              </p>
            </div>
          </GlassCard>

          {/* ── My Referrals List ── */}
          <GlassCard style={{ padding: '24px' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-[var(--text)] font-display">
                  My Referrals
                </h3>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  Students enrolled through your referral link (newest first).
                </p>
              </div>
              <span className="text-xs font-mono text-[var(--text-faint)]">
                {stats?.referralsList.length ?? 0} Students
              </span>
            </div>

            {stats?.referralsList.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] text-xs">
                No students enrolled via your link yet. Share your code with classmates to start earning Pro access!
              </div>
            ) : (
              <div className="space-y-2">
                {stats?.referralsList.map((ref) => (
                  <div
                    key={ref.id}
                    className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between flex-wrap gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[var(--card)] border border-[var(--border)] flex items-center justify-center font-bold text-[var(--text)]">
                        {ref.studentName[0]?.toUpperCase() || 'S'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[var(--text)]">{ref.studentName}</span>
                          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]">
                            #{ref.studentShortId}
                          </span>
                        </div>
                        <span className="text-[11px] text-[var(--muted)]">{ref.track}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-mono text-[var(--text-faint)]">
                        Joined: {ref.dateJoined}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        +1 Wk Pro
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* ── Section 6: AMBASSADOR TEST CREATOR ── */}
          <GlassCard style={{ padding: '24px' }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-[#D71921]" />
                  <h3 className="text-base sm:text-lg font-bold text-[var(--text)] font-display">
                    Captain Test Creator
                  </h3>
                </div>
                <p className="text-xs text-[var(--muted)] mt-1 max-w-xl leading-relaxed">
                  Author dedicated practice tests for students. Questions are stored separately from the main MCQ bank. Published public tests appear directly on the <strong>{GRAND_LINE_NAME}</strong> page for anyone in Pakistan to challenge.
                </p>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={() => setShowCreateModal(true)}
                className="shrink-0 cursor-pointer"
              >
                <Plus size={16} />
                <span>Create New Test</span>
              </Button>
            </div>

            {/* List of Created Tests */}
            {loadingTests ? (
              <div className="space-y-3">
                <Skeleton height={60} />
                <Skeleton height={60} />
              </div>
            ) : tests.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] text-xs space-y-2">
                <FileText size={24} className="mx-auto text-[var(--text-faint)]" />
                <p>You haven't authored any tests yet. Click "Create New Test" to import questions from CSV.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tests.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-[var(--text)]">{t.title}</span>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--text-faint)]">
                          {t.subject}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)]">
                          {t.questionCount} MCQs
                        </span>
                        {t.isPublic ? (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                            <Globe size={10} /> Public ({GRAND_LINE_NAME})
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1">
                            <Lock size={10} /> Private
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[var(--text-faint)] block mt-1">
                        Authored by you ({t.creatorShortId})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleViewAttempts(t)}
                        title="View student attempts"
                      >
                        <Eye size={13} />
                        <span>Attempts</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTogglePublish(t)}
                        title={t.isPublic ? 'Make Private' : 'Publish to Grand Line'}
                      >
                        {t.isPublic ? 'Unpublish' : 'Publish'}
                      </Button>
                      <button
                        onClick={() => handleDeleteTest(t.id)}
                        className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Delete test"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </>
      )}

      {/* ── CREATE TEST MODAL ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[var(--card)] border border-[var(--border)] p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h3 className="text-lg font-bold font-display text-[var(--text)]">Create Captain Test</h3>
                <p className="text-xs text-[var(--muted)]">Separate from main MCQ bank. Will not overwrite academy questions.</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[var(--muted)] hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTestSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">
                  Test Title
                </label>
                <input
                  type="text"
                  required
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  placeholder="e.g. NUST NET High-Yield Physics Sprint #1"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text)] focus:outline-none focus:border-[#D71921]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">
                    Subject
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text)] focus:outline-none focus:border-[#D71921]"
                  >
                    {SUBJECT_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">
                    Number of Questions
                  </label>
                  <select
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value) as 10 | 20 | 30 | 40 | 50)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text)] focus:outline-none focus:border-[#D71921]"
                  >
                    {QUESTION_COUNT_OPTIONS.map((count) => (
                      <option key={count} value={count}>
                        {count} Questions
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">
                  Visibility
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs text-[var(--text)] cursor-pointer">
                    <input
                      type="radio"
                      name="visibility"
                      checked={isPublic}
                      onChange={() => setIsPublic(true)}
                    />
                    <span>Public (Display on {GRAND_LINE_NAME} page)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-[var(--text)] cursor-pointer">
                    <input
                      type="radio"
                      name="visibility"
                      checked={!isPublic}
                      onChange={() => setIsPublic(false)}
                    />
                    <span>Private (Captain Tab Only)</span>
                  </label>
                </div>
              </div>

              {/* CSV Import Flow */}
              <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--text)]">Import Questions via CSV</span>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="text-[11px] font-bold text-[var(--accent)] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Download size={13} />
                    <span>Download CSV Template</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl border-2 border-dashed border-[var(--border)] hover:border-[#D71921] transition-colors text-center">
                  <Upload size={24} className="mx-auto text-[var(--muted)] mb-2" />
                  <label className="text-xs font-bold text-[#D71921] cursor-pointer hover:underline block">
                    Choose CSV File to Upload
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[11px] text-[var(--text-faint)] block mt-1">
                    Or paste raw CSV text below
                  </span>
                </div>

                <textarea
                  rows={4}
                  value={csvText}
                  onChange={(e) => handleParseCsv(e.target.value)}
                  placeholder="Paste CSV text here..."
                  className="w-full p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs font-mono text-[var(--text)] focus:outline-none focus:border-[#D71921]"
                />

                {parseErrors.length > 0 && (
                  <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/50 text-xs text-red-400 space-y-1">
                    <span className="font-bold flex items-center gap-1">
                      <AlertCircle size={14} /> Validation Warnings ({parseErrors.length} issues):
                    </span>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                      {parseErrors.slice(0, 5).map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                      {parseErrors.length > 5 && (
                        <li>...and {parseErrors.length - 5} more issues</li>
                      )}
                    </ul>
                  </div>
                )}

                {parsedQuestions.length > 0 && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/40 text-emerald-400 text-xs">
                    <span className="flex items-center gap-1.5 font-bold">
                      <CheckCircle2 size={14} /> {parsedQuestions.length} Questions parsed successfully
                    </span>
                    <span className="text-[11px] font-mono">
                      (Requires {questionCount} MCQs)
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
                <Button variant="ghost" size="sm" type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  loading={submittingTest}
                  disabled={parsedQuestions.length < questionCount}
                >
                  Create &amp; Publish Test
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ATTEMPTS MODAL (SECTION 7 REQUIREMENT) ── */}
      {viewingAttemptsTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-[var(--card)] border border-[var(--border)] p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h3 className="text-lg font-bold font-display text-[var(--text)]">
                  Student Attempts: {viewingAttemptsTest.title}
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Private attempt records (Name, Email, Test Title, Score, Time).
                </p>
              </div>
              <button
                onClick={() => setViewingAttemptsTest(null)}
                className="text-[var(--muted)] hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {loadingAttempts ? (
              <Skeleton height={100} />
            ) : testAttempts.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--muted)] bg-[var(--surface)] rounded-xl border border-[var(--border)]">
                No student attempts recorded for this test yet.
              </div>
            ) : (
              <div className="space-y-2">
                {testAttempts.map((att, i) => (
                  <div
                    key={att.id || i}
                    className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between flex-wrap gap-2 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[var(--text)]">{att.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--surface)] text-[var(--text-faint)] border border-[var(--border)]">
                          {att.entryTest}
                        </span>
                      </div>
                      <span className="text-[11px] text-[var(--muted)]">{att.email}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-bold text-sm text-[var(--text)] font-mono">
                          {att.score} / {att.totalQuestions}
                        </span>
                        <span className="text-[10px] font-mono text-[var(--text-faint)] block flex items-center gap-1 justify-end">
                          <Clock size={10} /> {att.timeTakenSeconds}s · {att.date}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-[var(--border)]">
              <Button variant="ghost" size="sm" onClick={() => setViewingAttemptsTest(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AmbassadorDashboardPage;

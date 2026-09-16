import React, { useState, useEffect } from 'react';
import { triggerHaptic, HAPTIC_PATTERNS } from '../lib/haptics';
import { BoardClass, HistoryItem, QuestionDifficulty, TestMode } from '../types';
import { MdcatDashboardPortal } from './MdcatDashboardPortal';
import { TcatDashboardPortal } from './TcatDashboardPortal';
import { EntranceDashboardPortal, EntranceTrackType } from './EntranceDashboardPortal';
import { getDashboardConfig, DASHBOARD_CONFIGS } from '../data/dashboardsConfig';
import { getBookmarkedQuestions, removeBookmark, BookmarkedQuestion } from '../lib/bookmarks';
import { User, StudentProfile } from '../lib/supabase';
import { getSubjectBadgeStyle } from '../utils/subjectBadge';
import { mapSubject } from '../utils/subjectMapper';
import { getFBISEChaptersForSubject, parseSubtopicsList, FBISEChapter } from '../data/fbiseSyllabus';
import { FormattedExplanation } from './FormattedExplanation';
import { MathText } from './MathText';
import { AnimatedCounter } from './AnimatedCounter';
import {
  BookOpen,
  Sparkles,
  Award,
  TrendingUp,
  BarChart3,
  Bookmark,
  ChevronRight,
  Play,
  ArrowLeft,
  Flame,
  Target,
  Trash2,
  ChevronDown,
  Layers
} from 'lucide-react';

interface ClassStreamDashboardProps {
  classNum: BoardClass;
  group: string;
  history: HistoryItem[];
  isAdmin?: boolean;
  currentUser?: User | null;
  userProfile?: StudentProfile | null;
  isGenerating?: boolean;
  isTestLimitReached?: boolean;
  onOpenAuth?: (intendedParams?: any) => void;
  onSelectStream: (cNum: BoardClass, grp: string) => void;
  onStartTest: (params: {
    subject: string;
    customTopic?: string;
    topic?: string;
    subtopic?: string;
    chapterName?: string;
    durationMinutes: number;
    questionCount: number;
    difficulty: QuestionDifficulty;
    mode: TestMode;
    instantFeedback: boolean;
    bypassCache?: boolean;
    groupSubjects?: string[];
    isFullMock?: boolean;
  }) => void;
  onBackToClasses: () => void;
  onOpenHistory?: () => void;
  onUpdateProfile?: (updatedProfile: StudentProfile) => void;
  onUpgradeClick?: () => void;
}

export const ClassStreamDashboard: React.FC<ClassStreamDashboardProps> = React.memo(({
  classNum,
  group,
  history,
  isAdmin = false,
  currentUser,
  userProfile,
  isGenerating = false,
  isTestLimitReached = false,
  onOpenAuth,
  onSelectStream,
  onStartTest,
  onBackToClasses,
  onOpenHistory,
  onUpdateProfile,
  onUpgradeClick,
}) => {
  const rawTrackStr = `${String(classNum)} ${String(group)}`.toUpperCase();
  const matchedEntranceTrack: EntranceTrackType | null = (() => {
    const directKeys: EntranceTrackType[] = [
      'FBISE', 'MDCAT', 'TCAT',
      'NET', 'FAST', 'ECAT', 'ETEA', 'NUMS', 'GIKI', 'USAT',
      'NED', 'PIEAS', 'NAT', 'IBA', 'AKU', 'MUET', 'LUMS',
      'NUML', 'HITEC', 'NUTECH'
    ];
    const upperClass = String(classNum).toUpperCase();
    const upperGroup = String(group).toUpperCase();
    for (const key of directKeys) {
      if (upperClass === key || upperGroup === key) return key;
    }
    if (rawTrackStr.includes('MDCAT') || rawTrackStr.includes('PMDC')) return 'MDCAT';
    if (rawTrackStr.includes('TCAT') || rawTrackStr.includes('UET TAXILA')) return 'TCAT';
    if (rawTrackStr.includes('NET') || rawTrackStr.includes('NUST')) return 'NET';
    if (rawTrackStr.includes('FAST-NU') || (rawTrackStr.includes('FAST') && !rawTrackStr.includes('NTS'))) return 'FAST';
    if (rawTrackStr.includes('ECAT') || rawTrackStr.includes('UET LAHORE')) return 'ECAT';
    if (rawTrackStr.includes('ETEA') || rawTrackStr.includes('UET PESHAWAR')) return 'ETEA';
    if (rawTrackStr.includes('NUMS') || rawTrackStr.includes('ARMY MEDICAL')) return 'NUMS';
    if (rawTrackStr.includes('GIKI')) return 'GIKI';
    if (rawTrackStr.includes('USAT') || rawTrackStr.includes('HEC')) return 'USAT';
    if (rawTrackStr.includes('NED')) return 'NED';
    if (rawTrackStr.includes('PIEAS')) return 'PIEAS';
    if (rawTrackStr.includes('NTS') || rawTrackStr.includes(' NAT')) return 'NAT';
    if (rawTrackStr.includes('IBA')) return 'IBA';
    if (rawTrackStr.includes('AKU') || rawTrackStr.includes('AGA KHAN')) return 'AKU';
    if (rawTrackStr.includes('MUET') || rawTrackStr.includes('MEHRAN')) return 'MUET';
    if (rawTrackStr.includes('LUMS') || rawTrackStr.includes('LCAT')) return 'LUMS';
    if (rawTrackStr.includes('NUML')) return 'NUML';
    if (rawTrackStr.includes('HITEC')) return 'HITEC';
    if (rawTrackStr.includes('NUTECH') || rawTrackStr.includes('NUET')) return 'NUTECH';
    return null;
  })();

  if (matchedEntranceTrack) {
    return (
      <EntranceDashboardPortal
        track={matchedEntranceTrack}
        selectedGroup={String(group)}
        currentUser={currentUser || null}
        userProfile={userProfile}
        history={history}
        isTestLimitReached={isTestLimitReached}
        isAdmin={isAdmin}
        onSelectTrack={(newTrack) => {
          if (onSelectStream) {
            onSelectStream(newTrack as any, newTrack);
          }
        }}
        onStartTest={(params) => {
          const effectiveTopic = params.topic || (params.subtopic ? `${params.chapterName ? params.chapterName + ' - ' : ''}${params.subtopic}` : params.chapterName);
          onStartTest({
            subject: params.subject,
            customTopic: effectiveTopic,
            topic: effectiveTopic,
            subtopic: params.subtopic,
            chapterName: params.chapterName,
            durationMinutes: params.durationMinutes,
            questionCount: params.questionCount,
            difficulty: params.difficulty,
            mode: params.mode,
            instantFeedback: params.mode !== 'ai-custom',
            groupSubjects: params.groupSubjects,
            isFullMock: params.isFullMock,
          });
        }}
        onOpenAuth={onOpenAuth || (() => {})}
        onOpenHistory={onOpenHistory || (() => {})}
        onBackToMainScreen={onBackToClasses}
        onUpgradeClick={onUpgradeClick}
      />
    );
  }

  const config = getDashboardConfig(classNum, group);
  const [activeTab, setActiveTab] = useState<
    'subjects' | 'mock' | 'progress' | 'analytics' | 'bookmarks'
  >('subjects');

  const [selectedFbiseSubject, setSelectedFbiseSubject] = useState<string | null>(null);
  const [selectedFbiseChapter, setSelectedFbiseChapter] = useState<FBISEChapter | null>(null);

  const [showStreamSelector, setShowStreamSelector] = useState(false);

  // Filter history items relevant to this class and group
  const getItemPercentage = (item: HistoryItem | any): number => {
    if (typeof item.percentage === 'number' && !isNaN(item.percentage) && item.percentage > 0) {
      return item.percentage;
    }
    const score = Number(item.score ?? item.correct ?? 0);
    const total = Number(item.total ?? 0);
    if (total > 0) {
      return Math.round((score / total) * 100);
    }
    return typeof item.percentage === 'number' && !isNaN(item.percentage) ? item.percentage : 0;
  };

  const isSubjectMatch = (itemSubject: string, targetSubject: string): boolean => {
    if (!itemSubject || !targetSubject) return false;
    const s1 = itemSubject.toLowerCase().trim();
    const s2 = targetSubject.toLowerCase().trim();
    if (s1.includes(s2) || s2.includes(s1)) return true;
    if ((s1.includes('math') && s2.includes('math')) ||
        (s1.includes('comp') && s2.includes('comp')) ||
        (s1.includes('bio') && s2.includes('bio')) ||
        (s1.includes('chem') && s2.includes('chem')) ||
        (s1.includes('phys') && s2.includes('phys')) ||
        (s1.includes('urd') && s2.includes('urd')) ||
        (s1.includes('eng') && s2.includes('eng')) ||
        (s1.includes('isl') && s2.includes('isl')) ||
        (s1.includes('pak') && s2.includes('pak'))) {
      return true;
    }
    return false;
  };

  const matchedStreamHistory = history.filter((item) => {
    const label = (item.pathLabel || '').toLowerCase();
    const sub = (item.subject || '').toLowerCase();
    return label.includes(String(classNum)) || sub.includes(String(classNum));
  });
  const streamHistory = matchedStreamHistory.length > 0 ? matchedStreamHistory : history;

  // Bookmarks state
  const [bookmarks, setBookmarks] = useState<BookmarkedQuestion[]>(() => getBookmarkedQuestions());
  const [selectedBookmarkSubject, setSelectedBookmarkSubject] = useState<string>('All');
  const [expandedBookmarkId, setExpandedBookmarkId] = useState<string | null>(null);

  useEffect(() => {
    setBookmarks(getBookmarkedQuestions());
  }, [activeTab]);

  // Calculate daily practice streak based on test history
  const calculateDailyStreak = (historyItems: HistoryItem[]): number => {
    if (!historyItems || historyItems.length === 0) return 0;

    const uniqueDays = new Set<string>();
    historyItems.forEach((item) => {
      let dateObj: Date | null = null;
      if (item.dateStr) {
        dateObj = new Date(item.dateStr);
      }
      if (!dateObj || isNaN(dateObj.getTime())) {
        dateObj = new Date();
      }
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      uniqueDays.add(`${year}-${month}-${day}`);
    });

    const formatDate = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const today = new Date();
    const todayStr = formatDate(today);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDate(yesterday);

    let currentCheck = new Date(today);
    if (!uniqueDays.has(todayStr)) {
      if (!uniqueDays.has(yesterdayStr)) {
        return 0;
      }
      currentCheck = yesterday;
    }

    let streak = 0;
    while (true) {
      const dayStr = formatDate(currentCheck);
      if (uniqueDays.has(dayStr)) {
        streak++;
        currentCheck.setDate(currentCheck.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  const dailyStreak = calculateDailyStreak(history);

  // Calculate stream-specific stats
  const totalTestsCount = streamHistory.length;
  const avgAccuracy = totalTestsCount > 0
    ? Math.round(streamHistory.reduce((acc, curr) => acc + getItemPercentage(curr), 0) / totalTestsCount)
    : 0;

  const handleLaunchPractice = (subject: string, topic?: string) => {
    triggerHaptic(HAPTIC_PATTERNS.medium);
    const targetSub = mapSubject(subject);
    onStartTest({
      subject: targetSub,
      customTopic: topic,
      durationMinutes: 10,
      questionCount: 10,
      difficulty: 'Medium',
      mode: 'instant',
      instantFeedback: true,
    });
  };

  const handleLaunchMock = (subject?: string) => {
    triggerHaptic(HAPTIC_PATTERNS.medium);
    const targetSub = mapSubject(subject || config.subjects[0] || 'Physics');
    onStartTest({
      subject: targetSub,
      durationMinutes: config.mockExamTimeMinutes,
      questionCount: config.mockQuestionCount,
      difficulty: 'Exam Standard',
      mode: 'instant',
      instantFeedback: false,
    });
  };

  const handleRemoveBookmark = (id: string) => {
    const updated = removeBookmark(id);
    setBookmarks(updated);
  };

  const filteredBookmarks = bookmarks.filter((bm) => {
    if (selectedBookmarkSubject === 'All') return true;
    return bm.subject === selectedBookmarkSubject;
  });

  return (
    <section className="dashboard-container screen animate-ios-spring text-left flex flex-col gap-3 sm:gap-4 pb-4">
      {/* Top Header Card */}
      <div className="flex flex-col gap-3 bg-white border border-slate-200 rounded-[24px] sm:rounded-[28px] p-3.5 sm:p-5 shadow-sm">
        {/* Page Main H1 Heading */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1">
          <div>
            <h1 className="font-['Space_Grotesk'] text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Class {classNum} {group ? `(${group})` : ''} Exam Dashboard — Boardly by SHS Virtual Academy
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Online secondary education syllabus, chapter-wise MCQs, and full-length exam simulations.
            </p>
          </div>
          <span className="text-[11px] font-extrabold text-[#1E5AFF] bg-[#1E5AFF]/10 border border-[#1E5AFF]/20 px-3 py-1 rounded-full self-start sm:self-center shrink-0">
            FBISE Class {classNum}
          </span>
        </div>

        {isAdmin && (
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-200 mb-1">
            <button
              onClick={onBackToClasses}
              className="text-xs font-bold text-slate-700 hover:text-rose-600 flex items-center gap-1 active:scale-95 transition-transform cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Portals</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowStreamSelector(!showStreamSelector)}
                className="flex items-center gap-1.5 text-xs font-extrabold bg-rose-500/10 text-rose-700 border border-rose-500/30 px-3 py-1 rounded-full hover:bg-rose-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Switch Portal (Admin)</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {showStreamSelector && (
                <div className="absolute right-0 top-9 z-50 w-64 bg-white border border-slate-200 rounded-2xl p-2 shadow-2xl max-h-72 overflow-y-auto">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2 py-1">
                    Select Class &amp; Entry Portal
                  </div>
                  {DASHBOARD_CONFIGS.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectStream(item.classNum, item.group);
                        setShowStreamSelector(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between hover:bg-slate-100 transition-colors ${
                        item.classNum === classNum && item.group === group
                          ? 'bg-rose-50 text-rose-600 '
                          : 'text-slate-800 '
                      }`}
                    >
                      <span>{item.shortTitle}</span>
                      <span className="text-[10px] opacity-70">{item.levelTag}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Core Stats Bar */}
        <div className="w-full bg-slate-100 p-3.5 rounded-2xl border border-slate-200/80 shrink-0">
          {/* 4 Core Metrics Grid */}
          <div className="grid grid-cols-4 divide-x divide-slate-300/60 items-center w-full">
            {/* Streak */}
            <div className="text-center px-1 sm:px-2">
              <div className="text-sm sm:text-base font-extrabold text-orange-500 flex items-center justify-center gap-0.5">
                <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-orange-500 text-orange-500 animate-pulse shrink-0" />
                <AnimatedCounter value={dailyStreak} duration={1000} />
              </div>
              <div className="text-[9px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Streak</div>
            </div>

            {/* Tests */}
            <div className="text-center px-1 sm:px-2">
              <div className="text-sm sm:text-base font-extrabold text-slate-900 ">
                <AnimatedCounter value={totalTestsCount} duration={1000} />
              </div>
              <div className="text-[9px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Tests</div>
            </div>

            {/* Accuracy */}
            <div className="text-center px-1 sm:px-2">
              <div className="text-sm sm:text-base font-extrabold text-emerald-600 ">
                <AnimatedCounter value={avgAccuracy} suffix="%" duration={1000} />
              </div>
              <div className="text-[9px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Accuracy</div>
            </div>

            {/* Saved */}
            <div className="text-center px-1 sm:px-2">
              <div className="text-sm sm:text-base font-extrabold text-blue-600 ">
                <AnimatedCounter value={bookmarks.length} duration={1000} />
              </div>
              <div className="text-[9px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Saved</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'subjects', label: 'Subjects', icon: BookOpen },
          { id: 'mock', label: 'Mock Exams', icon: Award },
          { id: 'progress', label: 'Progress', icon: TrendingUp },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'bookmarks', label: `Saved (${bookmarks.length})`, icon: Bookmark },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer active:scale-95 ${
                isActive
                  ? 'bg-[#0A0A0A] text-white   shadow-md font-bold'
                  : 'bg-white  text-slate-700  border border-black/10  hover:border-[#1E5AFF]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT AREA */}

      {/* TAB 1: FULL SUBJECT-WISE MOCK TESTS */}
      {activeTab === 'subjects' && (
        <div className="flex flex-col gap-4 animate-ios-spring">
          <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-black uppercase text-slate-500  tracking-wider">
                    Stream Subjects ({config.subjects.length})
                  </h2>
                  <p className="text-xs text-slate-600  mt-0.5">
                    Select a subject to view its syllabus chapters or practice directly
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-600  bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full hidden sm:inline-block">
                  Class {classNum} • {group}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {config.subjects.map((subject) => {
                  const badge = getSubjectBadgeStyle(subject);
                  const chapters = getFBISEChaptersForSubject(classNum, subject);

                  // Subject stats from history
                  const subTests = streamHistory.filter((h) => isSubjectMatch(h.subject, subject));
                  const subAvg = subTests.length > 0
                    ? Math.round(subTests.reduce((acc, c) => acc + getItemPercentage(c), 0) / subTests.length)
                    : 0;

                  return (
                    <div
                      key={subject}
                      className="bg-white  border border-slate-200  rounded-[22px] p-4 flex flex-col justify-between hover:border-emerald-500  transition-all shadow-xs group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
                            {subject.substring(0, 3).toUpperCase()}
                          </span>
                          {subAvg > 0 && (
                            <span className="text-[11px] font-bold text-emerald-600  bg-emerald-50  px-2 py-0.5 rounded-full">
                              {subAvg}% Avg
                            </span>
                          )}
                        </div>

                        <div>
                          <h3 className="text-base font-extrabold text-slate-900  group-hover:text-emerald-600  transition-colors">
                            {subject}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 ">
                            <span className="flex items-center gap-1 font-semibold text-slate-700 ">
                              <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                              {chapters.length} Chapters
                            </span>
                            <span>•</span>
                            <span className="text-rose-500 font-bold flex items-center gap-1">
                              <Flame className="w-3.5 h-3.5" />
                              {chapters.filter((c) => c.isHighYield).length} High Yield
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <button
                          onClick={() => handleLaunchMock(subject)}
                          className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-xs"
                          title={`Launch Full Subject Mock for ${subject}`}
                        >
                          <Award className="w-3.5 h-3.5 text-amber-400" />
                          <span>Full Subject Mock Test</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
      )}
      {/* TAB 2: MOCK EXAMS */}
      {activeTab === 'mock' && (
        <div className="bg-white  border border-slate-200  rounded-[24px] p-4 sm:p-5 animate-ios-spring flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <Award className="w-6 h-6 text-blue-500" />
            <div>
              <h2 className="text-base font-black text-slate-900 ">
                Full-Length FBISE Mock Exam
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Simulated {config.levelTag} FBISE Exam environment.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-slate-50  p-3 rounded-2xl border border-slate-200  text-center">
            <div>
              <div className="text-xs font-bold text-slate-500">Duration</div>
              <div className="text-sm font-black text-slate-900 ">{config.mockExamTimeMinutes} Mins</div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500">Questions</div>
              <div className="text-sm font-black text-slate-900 ">{config.mockQuestionCount} MCQs</div>
            </div>
            <div className="col-span-1">
              <div className="text-xs font-bold text-slate-500">Pass Mark</div>
              <div className="text-sm font-black text-emerald-600 ">50% Standard</div>
            </div>
          </div>

          <div className="text-xs text-slate-600  leading-relaxed">
            • Instant feedback is turned off during the exam to simulate real test conditions.<br />
            • Complete all questions within the allocated time before submitting.
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => handleLaunchMock()}
              className="w-full py-3 bg-[#1E5AFF] hover:bg-[#1546CC] text-white rounded-2xl font-extrabold text-sm active:scale-98 transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
              <Award className="w-4 h-4" />
              <span>Start Stream FBISE Mock Exam</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: PROGRESS TRACKING */}
      {activeTab === 'progress' && (
        <div className="flex flex-col gap-3 animate-ios-spring">
          <div className="bg-white  border border-slate-200  rounded-[24px] p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase">Stream Mastery</div>
              <div className="text-2xl font-black text-slate-900  mt-1">{avgAccuracy}%</div>
              <div className="text-xs text-slate-500 mt-0.5">Based on {totalTestsCount} test sessions</div>
            </div>
            <div className="w-16 h-16 rounded-full border-4 border-emerald-500 flex items-center justify-center font-black text-sm">
              {avgAccuracy}%
            </div>
          </div>

          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Subject Wise Mastery
          </div>

          {config.subjects.map((sub) => {
            const subTests = streamHistory.filter((h) => isSubjectMatch(h.subject, sub));
            const subAvg = subTests.length > 0
              ? Math.round(subTests.reduce((acc, c) => acc + getItemPercentage(c), 0) / subTests.length)
              : 0;

            return (
              <div key={sub} className="bg-white  border border-slate-200  rounded-2xl p-3.5 flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-900 ">{sub}</span>
                  <span className="text-emerald-600 ">{subAvg}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100  rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 transition-all" style={{ width: `${subAvg}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 4: PERFORMANCE ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="bg-white  border border-slate-200  rounded-[24px] p-4 sm:p-5 animate-ios-spring flex flex-col gap-4">
          <h2 className="text-sm font-black text-slate-900  uppercase tracking-wider">
            Performance & Speed Analytics
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-50  p-3 rounded-2xl border border-slate-200 ">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Avg Response Time</div>
              <div className="text-base font-black text-slate-900  mt-1">42 sec / q</div>
            </div>
            <div className="bg-slate-50  p-3 rounded-2xl border border-slate-200 ">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Highest Score</div>
              <div className="text-base font-black text-emerald-600  mt-1">
                {streamHistory.length > 0 ? `${Math.max(...streamHistory.map(h => getItemPercentage(h)))}%` : 'N/A'}
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-600  leading-relaxed">
            <strong>Key Focus Area:</strong> Practice questions regularly to increase speed and maintain consistent scores above 80% for top FBISE exam ranking.
          </div>
        </div>
      )}

      {/* TAB 5: SAVED & BOOKMARKED QUESTIONS */}
      {activeTab === 'bookmarks' && (
        <div className="flex flex-col gap-3 animate-ios-spring">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase text-slate-500  tracking-wider">
              Saved Bookmarked Questions ({filteredBookmarks.length})
            </h2>

            <select
              value={selectedBookmarkSubject}
              onChange={(e) => setSelectedBookmarkSubject(e.target.value)}
              className="bg-white  border border-slate-200  rounded-xl px-2.5 py-1 text-xs font-bold text-slate-900 "
            >
              <option value="All">All Subjects</option>
              {config.subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {filteredBookmarks.length === 0 ? (
            <div className="bg-white  border border-slate-200  rounded-[24px] p-6 text-center text-slate-500 text-xs font-medium">
              No bookmarked questions saved yet for this filter. During practice or test review, click the bookmark icon to save high-yield questions here!
            </div>
          ) : (
            filteredBookmarks.map((bm, index) => {
              const isExpanded = expandedBookmarkId === bm.id;
              return (
                <div
                  key={bm.id}
                  className="bg-white  border border-slate-200  rounded-2xl p-4 flex flex-col gap-2 shadow-xs"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                    <span className="text-emerald-600 ">{bm.subject}</span>
                    <button
                      onClick={() => handleRemoveBookmark(bm.id)}
                      className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                      title="Remove Bookmark"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-xs font-bold text-slate-900  leading-relaxed">
                    <span className="mr-1">{index + 1}.</span>
                    <MathText text={bm.question.q} />
                  </div>

                  <button
                    onClick={() => setExpandedBookmarkId(isExpanded ? null : bm.id)}
                    className="text-[11px] font-bold text-emerald-600  hover:underline text-left self-start mt-1 flex items-center gap-1"
                  >
                    <span>{isExpanded ? 'Hide Details' : 'Show Options & Explanation'}</span>
                  </button>

                  {isExpanded && (
                    <div className="mt-2 pt-2 border-t border-slate-100  flex flex-col gap-1.5 text-xs">
                      {bm.question.options.map((opt, optIdx) => (
                        <div
                          key={optIdx}
                          className={`p-2 rounded-xl text-xs font-medium border ${
                            optIdx === bm.question.correct
                              ? 'bg-emerald-50  border-emerald-300  text-emerald-900  font-bold'
                              : 'bg-[#F2F2F7]  border-slate-200  text-slate-700 '
                          }`}
                        >
                          <MathText text={opt} /> {optIdx === bm.question.correct && ' ✓'}
                        </div>
                      ))}
                      {bm.question.explain && (
                        <div className="mt-1 p-2.5 bg-blue-50  text-blue-900  text-[11px] rounded-xl border border-blue-200 ">
                          <strong className="block mb-1 text-[#F2B90C]">Explanation:</strong>
                          <FormattedExplanation text={bm.question.explain} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </section>
  );
});

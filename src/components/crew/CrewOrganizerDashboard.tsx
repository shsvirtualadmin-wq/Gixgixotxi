import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Sparkles,
  Plus,
  Calendar,
  Clock,
  Users,
  Trophy,
  ArrowRight,
  Copy,
  Check,
  Share2,
  Trash2,
  Edit3,
  Repeat,
  CheckCircle2,
  AlertCircle,
  Download,
  Eye,
  RefreshCw,
  Search,
  Filter,
  BarChart3,
  ArrowLeft,
  X,
  FileSpreadsheet,
  Lock,
  ChevronRight,
  ExternalLink,
  Flame,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  CrewEvent,
  CrewEventType,
  CrewEventStatus,
  CrewEventVisibility,
  PublicLeaderboardEntry,
} from '../../types/crewEvents';
import { Question } from '../../types';
import {
  fetchCrewEvents,
  saveCrewEvent,
  duplicateCrewEvent,
  closeCrewEvent,
  deleteCrewEvent,
  fetchEventLeaderboard,
  formatSafeDisplayName,
} from '../../lib/crewEventsStore';
import { getPrebuiltQuestionsForSubject } from '../../data/prebuiltQuestions';
import { MathText } from '../MathText';

interface CrewOrganizerDashboardProps {
  onBackToApp?: () => void;
  onNavigateApply?: () => void;
  onOpenPublicEvent?: (eventId: string) => void;
}

export const CrewOrganizerDashboard: React.FC<CrewOrganizerDashboardProps> = ({
  onBackToApp,
  onNavigateApply,
  onOpenPublicEvent,
}) => {
  const { user, profile, isAdmin } = useAuth();

  const isCrewApproved =
    isAdmin ||
    profile?.role === 'crew' ||
    profile?.roles?.includes('crew') ||
    profile?.role === 'organizer' ||
    profile?.roles?.includes('organizer');

  const [events, setEvents] = useState<CrewEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'live' | 'scheduled' | 'draft' | 'ended'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Create / Edit Event Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  // Form Fields
  const [formType, setFormType] = useState<CrewEventType>('Boardly Blitz');
  const [formTitle, setFormTitle] = useState('');
  const [formSubjects, setFormSubjects] = useState<string[]>(['Physics']);
  const [formTopics, setFormTopics] = useState<string>('');
  const [formQuestionCount, setFormQuestionCount] = useState<number>(30);
  const [formDurationMinutes, setFormDurationMinutes] = useState<number>(30);
  const [formDifficulty, setFormDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Exam Standard'>('Exam Standard');
  const [formStartTime, setFormStartTime] = useState<string>(() => new Date().toISOString().slice(0, 16));
  const [formEndTime, setFormEndTime] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 16);
  });
  const [formVisibility, setFormVisibility] = useState<CrewEventVisibility>('public');
  const [formDescription, setFormDescription] = useState('');
  const [formRetakesAllowed, setFormRetakesAllowed] = useState(false);
  const [pickedQuestions, setPickedQuestions] = useState<Question[]>([]);
  const [formStep, setFormStep] = useState<1 | 2>(1); // 1 = config, 2 = question review & swap

  // Per-Event Details Modal
  const [viewingEvent, setViewingEvent] = useState<CrewEvent | null>(null);
  const [eventLeaderboard, setEventLeaderboard] = useState<PublicLeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  // Copy notice toast
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCrewEvents(isAdmin ? undefined : user?.uid);
      setEvents(data);
    } catch (err) {
      console.warn('[CrewOrganizerDashboard] Error loading events:', err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, user?.uid]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Load leaderboard when an event is selected for viewing
  useEffect(() => {
    if (viewingEvent) {
      setLoadingLeaderboard(true);
      fetchEventLeaderboard(viewingEvent.id)
        .then((lb) => setEventLeaderboard(lb))
        .catch(console.warn)
        .finally(() => setLoadingLeaderboard(false));
    }
  }, [viewingEvent]);

  // Computed Overview Metrics
  const overviewStats = useMemo(() => {
    const totalCreated = events.length;
    const totalRegistrations = events.reduce((acc, e) => acc + (e.totalRegistrations || 0), 0);
    const totalAttempts = events.reduce((acc, e) => acc + (e.totalAttempts || 0), 0);
    const avgScore =
      events.length > 0
        ? Math.round((events.reduce((acc, e) => acc + (e.averageScore || 0), 0) / events.length) * 10) / 10
        : 0;

    return { totalCreated, totalRegistrations, totalAttempts, avgScore };
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (activeTab !== 'all' && e.status !== activeTab) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          e.title.toLowerCase().includes(q) ||
          e.type.toLowerCase().includes(q) ||
          e.subjects.some((s) => s.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [events, activeTab, searchQuery]);

  // Handle Question Auto-Picking based on filters
  const handleAutoPickQuestions = () => {
    const chosenSubject = formSubjects[0] || 'Physics';
    const pool = getPrebuiltQuestionsForSubject(chosenSubject, formTopics || undefined);
    let sample = [...pool];

    if (sample.length === 0) {
      // Fallback to core physics if topic didn't match
      sample = getPrebuiltQuestionsForSubject('Physics');
    }

    // Shuffle and pick desired count
    sample.sort(() => 0.5 - Math.random());
    const finalSet = sample.slice(0, formQuestionCount);
    setPickedQuestions(finalSet);
    setFormStep(2);
  };

  // Swap question with another from pool
  const handleSwapQuestion = (indexToSwap: number) => {
    const chosenSubject = formSubjects[0] || 'Physics';
    const pool = getPrebuiltQuestionsForSubject(chosenSubject);
    const existingIds = new Set(pickedQuestions.map((q) => q.id));
    const available = pool.filter((q) => !existingIds.has(q.id));

    if (available.length > 0) {
      const replacement = available[Math.floor(Math.random() * available.length)];
      setPickedQuestions((prev) => {
        const next = [...prev];
        next[indexToSwap] = replacement;
        return next;
      });
    }
  };

  const handleRemoveQuestion = (indexToRemove: number) => {
    setPickedQuestions((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSaveEvent = async (status: CrewEventStatus = 'live') => {
    try {
      const idToSave = editingEventId || undefined;
      const eventPayload: Partial<CrewEvent> = {
        id: idToSave,
        organizerId: user?.uid || 'crew-org',
        organizerName: formatSafeDisplayName(profile?.name || user?.displayName, user?.email),
        organizerEmail: user?.email || '',
        type: formType,
        title: formTitle.trim() || `${formType}: ${formSubjects.join(', ')} Challenge`,
        subjects: formSubjects,
        topics: formTopics ? [formTopics] : [],
        questionCount: pickedQuestions.length || formQuestionCount,
        durationMinutes: formDurationMinutes,
        difficulty: formDifficulty,
        startTime: new Date(formStartTime).toISOString(),
        endTime: new Date(formEndTime).toISOString(),
        visibility: formVisibility,
        description: formDescription,
        retakesAllowed: formRetakesAllowed,
        status,
        questions: pickedQuestions,
      };

      await saveCrewEvent(eventPayload);
      setShowCreateModal(false);
      setEditingEventId(null);
      setFormStep(1);
      setActionNotice('Event published successfully!');
      setTimeout(() => setActionNotice(null), 3000);
      loadEvents();
    } catch (err: any) {
      alert(`Error saving event: ${err?.message}`);
    }
  };

  const handleShareLink = (eventId: string) => {
    const url = `${window.location.origin}/events/${eventId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(eventId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCsv = async (event: CrewEvent) => {
    try {
      const res = await fetch(`/api/crew/events/${event.id}/export-csv`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `boardly-event-${event.id}-results.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        // Client-side CSV fallback
        let csv = 'Rank,Student Name,Score,Total,Percentage,Time Taken\n';
        eventLeaderboard.forEach((r) => {
          csv += `${r.rank},"${r.displayName}",${r.score},${r.total},${r.percentage}%,${r.timeTakenSeconds}s\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `boardly-event-${event.id}-results.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.warn('CSV export error:', err);
    }
  };

  // If user is not yet approved as Crew Organizer
  if (!isCrewApproved) {
    return (
      <div className="min-h-screen bg-[#07061d] text-white flex flex-col items-center justify-center p-4 sm:p-6 text-center select-none">
        <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-2xl border border-violet-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-950/80 border border-amber-500/40 text-amber-400 mx-auto flex items-center justify-center">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 px-3 py-1 rounded-full border border-amber-500/30">
              Approved Organizers Only
            </span>
            <h2 className="text-xl sm:text-2xl font-black font-display text-white">
              Boardly Crew Portal
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              The Crew organizer dashboard is exclusively accessible to approved student event hosts. Submit your
              application to host official Blitz and Arena drills for your campus!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              onClick={() => {
                if (onNavigateApply) onNavigateApply();
                else window.history.pushState({}, '', '/crew');
              }}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-teal-500 text-white font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer shadow-lg shadow-violet-600/30"
            >
              Apply as Crew Organizer
            </button>
            <button
              onClick={() => {
                if (onBackToApp) onBackToApp();
                else window.history.pushState({}, '', '/app');
              }}
              className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
            >
              Back to App
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07061d] text-white pb-24 font-sans select-none">
      {/* Top Glass Header */}
      <header className="sticky top-0 z-30 bg-[#090826]/90 backdrop-blur-xl border-b border-violet-500/20 px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (onBackToApp) onBackToApp();
              else window.history.pushState({}, '', '/app');
            }}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Return to Student App"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black font-display text-white tracking-tight">
                Boardly Crew Organizer
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-gradient-to-r from-violet-600 to-indigo-600 text-white border border-violet-400/30">
                CREW
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Host authentic timed entry-test competitions & monitor live scoreboards
            </p>
          </div>
        </div>

        {/* Create Event CTA */}
        <button
          onClick={() => {
            setEditingEventId(null);
            setPickedQuestions([]);
            setFormStep(1);
            setShowCreateModal(true);
          }}
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-teal-500 hover:opacity-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-violet-600/30 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Create Event</span>
          <span className="sm:hidden">Create</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Action Notice Toast */}
        {actionNotice && (
          <div className="p-3.5 rounded-2xl bg-teal-950/80 border border-teal-500/40 text-teal-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* 1. Overview Statistics Cards (Mobile First 2x2 Grid) */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-violet-500/25 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Events Created</span>
              <Calendar className="w-4 h-4 text-violet-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-white mt-2">
              {overviewStats.totalCreated}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Total Organized</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-violet-500/25 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Registrations</span>
              <Users className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-white mt-2">
              {overviewStats.totalRegistrations}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Total Enrolled</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-violet-500/25 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Attempts</span>
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-white mt-2">
              {overviewStats.totalAttempts}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Submitted Tests</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-violet-500/25 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Average Score</span>
              <Flame className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-white mt-2">
              {overviewStats.avgScore || '—'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Mean Score</div>
          </div>
        </section>

        {/* 2. My Events List Header & Tabs */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-display text-white">
                My Events
              </h2>
              <p className="text-xs text-slate-400">
                Manage your hosted mock exams, view real-time participants, and export CSVs
              </p>
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {(['all', 'live', 'scheduled', 'draft', 'ended'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase font-mono tracking-wider transition-all cursor-pointer ${
                    activeTab === tab
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Events Grid / Cards */}
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs animate-pulse">
              Loading your hosted events...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/60 border border-dashed border-violet-500/30 text-center space-y-3">
              <Calendar className="w-8 h-8 text-violet-400 mx-auto opacity-70" />
              <h3 className="text-base font-bold text-white">No Events in this category</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Ready to organize your first sprint? Tap Create Event to pick questions and schedule a test.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 rounded-xl bg-violet-600 text-white font-bold text-xs hover:bg-violet-500 transition-colors cursor-pointer"
              >
                Create Event Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredEvents.map((evt) => {
                const isLive = evt.status === 'live';
                const isScheduled = evt.status === 'scheduled';

                return (
                  <div
                    key={evt.id}
                    className="p-5 rounded-3xl bg-slate-900/80 border border-violet-500/25 hover:border-violet-500/40 transition-all space-y-4 shadow-xl flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-400 bg-teal-950/60 border border-teal-500/30 px-2.5 py-0.5 rounded-full">
                          {evt.type}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {isLive && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              LIVE
                            </span>
                          )}
                          {isScheduled && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-950/80 text-sky-300 border border-sky-500/40">
                              Scheduled
                            </span>
                          )}
                          {evt.status === 'draft' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">
                              Draft
                            </span>
                          )}
                          {evt.status === 'ended' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-900 text-slate-500 border border-slate-800">
                              Ended
                            </span>
                          )}
                        </div>
                      </div>

                      <h3 className="text-base font-bold font-display text-white leading-snug">
                        {evt.title}
                      </h3>

                      {/* Chips row */}
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
                        <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10">
                          {evt.subjects.join(', ')}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {evt.durationMinutes}m
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10">
                          {evt.questionCount} Questions
                        </span>
                      </div>
                    </div>

                    {/* Stats & Actions bottom row */}
                    <div className="pt-3 border-t border-violet-500/15 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                        <span>
                          <strong className="text-white">{evt.totalRegistrations}</strong> reg
                        </span>
                        <span>
                          <strong className="text-white">{evt.totalAttempts}</strong> attempts
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Share link button */}
                        <button
                          onClick={() => handleShareLink(evt.id)}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="Copy share link"
                        >
                          {copiedId === evt.id ? (
                            <Check className="w-3.5 h-3.5 text-teal-300" />
                          ) : (
                            <Share2 className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* View & Leaderboard Button */}
                        <button
                          onClick={() => setViewingEvent(evt)}
                          className="px-3 py-1.5 rounded-xl bg-violet-600/30 hover:bg-violet-600/50 border border-violet-500/40 text-violet-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Results</span>
                        </button>

                        {/* Public Page Button */}
                        <button
                          onClick={() => {
                            if (onOpenPublicEvent) onOpenPublicEvent(evt.id);
                            else window.open(`/events/${evt.id}`, '_blank');
                          }}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                          title="Preview Public Page"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* 3. CREATE / EDIT EVENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl my-8 bg-[#0b0a2a] text-white rounded-3xl border border-violet-500/30 shadow-2xl p-5 sm:p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-violet-500/20">
              <div>
                <h3 className="text-lg sm:text-xl font-bold font-display text-white">
                  {formStep === 1 ? 'Configure Event' : 'Review & Swap Questions'}
                </h3>
                <p className="text-xs text-slate-400">
                  {formStep === 1
                    ? 'Step 1 of 2: Set tournament format, syllabus, and timing'
                    : 'Step 2 of 2: Auto-picked from bank. Preview, swap or remove questions'}
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formStep === 1 ? (
              /* Step 1: Configuration Form */
              <div className="space-y-4">
                {/* Event Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Event Type *</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as CrewEventType)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-violet-500/30 text-white text-xs cursor-pointer focus:outline-none focus:border-violet-400"
                  >
                    <option value="Boardly Blitz">Boardly Blitz (Rapid Speed Sprint)</option>
                    <option value="Boardly Arena">Boardly Arena (Head-to-Head Tournament)</option>
                    <option value="MDCAT Blitz">MDCAT Blitz (PMDC Medical Sprint)</option>
                    <option value="NUST NET Sprint">NUST NET Sprint (Engineering/CS)</option>
                    <option value="FAST-NU Mock">FAST-NU Mock (Speed & Negative Marking)</option>
                    <option value="ECAT Drill">ECAT Drill (UET Lahore Format)</option>
                    <option value="TCAT Challenge">TCAT Challenge</option>
                    <option value="FBISE Subject Test">FBISE Subject Test (Board Curriculum)</option>
                  </select>
                </div>

                {/* Event Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Event Title *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Boardly Blitz #19: Kinematics & Vectors Grand Drill"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-violet-500/30 text-white text-xs focus:outline-none focus:border-violet-400"
                  />
                </div>

                {/* Subjects & Topics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Primary Subject *</label>
                    <select
                      value={formSubjects[0] || 'Physics'}
                      onChange={(e) => setFormSubjects([e.target.value])}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-violet-500/30 text-white text-xs cursor-pointer focus:outline-none focus:border-violet-400"
                    >
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Biology">Biology</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="English">English</option>
                      <option value="Intelligence / Analytical">IQ & Analytical Reasoning</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Topic / Chapter (Optional)</label>
                    <input
                      type="text"
                      value={formTopics}
                      onChange={(e) => setFormTopics(e.target.value)}
                      placeholder="e.g. Electromagnetism, Cell Biology"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-violet-500/30 text-white text-xs focus:outline-none focus:border-violet-400"
                    />
                  </div>
                </div>

                {/* Question Count & Duration */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Questions *</label>
                    <select
                      value={formQuestionCount}
                      onChange={(e) => setFormQuestionCount(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-violet-500/30 text-white text-xs cursor-pointer focus:outline-none focus:border-violet-400"
                    >
                      <option value={15}>15 MCQs</option>
                      <option value={20}>20 MCQs</option>
                      <option value={30}>30 MCQs</option>
                      <option value={45}>45 MCQs</option>
                      <option value={60}>60 MCQs</option>
                      <option value={100}>100 MCQs (Grand Mock)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Duration (Mins) *</label>
                    <input
                      type="number"
                      min={5}
                      max={180}
                      value={formDurationMinutes}
                      onChange={(e) => setFormDurationMinutes(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-violet-500/30 text-white text-xs focus:outline-none focus:border-violet-400"
                    />
                  </div>
                </div>

                {/* Difficulty & Visibility */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Difficulty</label>
                    <select
                      value={formDifficulty}
                      onChange={(e) => setFormDifficulty(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-violet-500/30 text-white text-xs cursor-pointer focus:outline-none focus:border-violet-400"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                      <option value="Exam Standard">Exam Standard</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Visibility</label>
                    <select
                      value={formVisibility}
                      onChange={(e) => setFormVisibility(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-violet-500/30 text-white text-xs cursor-pointer focus:outline-none focus:border-violet-400"
                    >
                      <option value="public">Public (Visible on site)</option>
                      <option value="link_only">Link Only (Classroom secret link)</option>
                    </select>
                  </div>
                </div>

                {/* Start Time & End Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Start Time *</label>
                    <input
                      type="datetime-local"
                      value={formStartTime}
                      onChange={(e) => setFormStartTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-violet-500/30 text-white text-xs focus:outline-none focus:border-violet-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">End Time *</label>
                    <input
                      type="datetime-local"
                      value={formEndTime}
                      onChange={(e) => setFormEndTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-violet-500/30 text-white text-xs focus:outline-none focus:border-violet-400"
                    />
                  </div>
                </div>

                {/* Retakes toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-white">Allow Retakes</div>
                    <div className="text-[10px] text-slate-400">
                      Default is single attempt per candidate to enforce true competitive rank
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formRetakesAllowed}
                    onChange={(e) => setFormRetakesAllowed(e.target.checked)}
                    className="w-4 h-4 rounded text-violet-600 focus:ring-0 cursor-pointer"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Event Note / Guidelines</label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Brief description or rules for participants..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-violet-500/30 text-white text-xs focus:outline-none focus:border-violet-400 resize-none"
                  />
                </div>

                {/* Next Step Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleAutoPickQuestions}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-violet-600/30"
                  >
                    <span>Auto-Pick Questions from Bank</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* Step 2: Review, Swap, Remove Questions */
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-300 bg-white/5 p-3 rounded-xl border border-white/10">
                  <span>
                    Picked <strong className="text-white">{pickedQuestions.length}</strong> questions for{' '}
                    <strong className="text-teal-300">{formSubjects[0]}</strong>
                  </span>
                  <button
                    onClick={handleAutoPickQuestions}
                    className="text-xs text-violet-300 hover:text-white flex items-center gap-1 font-bold cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Re-roll All</span>
                  </button>
                </div>

                {/* Questions Preview List */}
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                  {pickedQuestions.map((q, idx) => (
                    <div
                      key={q.id || idx}
                      className="p-3.5 rounded-2xl bg-slate-900/90 border border-violet-500/20 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-400">Q{idx + 1}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleSwapQuestion(idx)}
                            className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title="Swap question with another random question from pool"
                          >
                            <Repeat className="w-3.5 h-3.5 text-teal-400" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(idx)}
                            className="p-1 rounded-lg bg-white/5 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Remove question"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="text-white font-medium">
                        <MathText text={q.q || q.question || ''} />
                      </div>

                      <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-300 pt-1">
                        {(q.options || []).map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className={`p-1.5 rounded-lg border ${
                              oIdx === q.correct
                                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                                : 'bg-white/5 border-white/5'
                            }`}
                          >
                            <span className="font-bold mr-1">{String.fromCharCode(65 + oIdx)}.</span>
                            <MathText text={opt} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Final Publish Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-violet-500/20">
                  <button
                    type="button"
                    onClick={() => setFormStep(1)}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold cursor-pointer"
                  >
                    Back to Config
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveEvent('draft')}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
                  >
                    Save as Draft
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveEvent('live')}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-teal-500 hover:opacity-90 text-white text-xs font-bold cursor-pointer shadow-lg shadow-violet-600/30"
                  >
                    Publish Event
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. PER-EVENT DETAILS & LEADERBOARD MODAL */}
      {viewingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl my-8 bg-[#0b0a2a] text-white rounded-3xl border border-violet-500/30 shadow-2xl p-5 sm:p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-violet-500/20">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-400 bg-teal-950/60 border border-teal-500/30 px-2.5 py-0.5 rounded-full">
                  {viewingEvent.type}
                </span>
                <h3 className="text-lg sm:text-xl font-bold font-display text-white">
                  {viewingEvent.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>{viewingEvent.subjects.join(', ')}</span>
                  <span>•</span>
                  <span>{viewingEvent.durationMinutes} Minutes</span>
                  <span>•</span>
                  <span>{viewingEvent.questionCount} Questions</span>
                </div>
              </div>
              <button
                onClick={() => setViewingEvent(null)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-slate-400 text-[11px]">Enrolled</div>
                <div className="text-xl font-bold font-mono text-white mt-0.5">
                  {viewingEvent.totalRegistrations}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-slate-400 text-[11px]">Submissions</div>
                <div className="text-xl font-bold font-mono text-white mt-0.5">
                  {viewingEvent.totalAttempts}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-slate-400 text-[11px]">Avg Score</div>
                <div className="text-xl font-bold font-mono text-teal-400 mt-0.5">
                  {viewingEvent.averageScore || '—'}
                </div>
              </div>
            </div>

            {/* Leaderboard Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>Live Leaderboard</span>
                </h4>

                {/* Export CSV button (names & scores only, strictly no emails/phones) */}
                <button
                  onClick={() => handleExportCsv(viewingEvent)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>

              {loadingLeaderboard ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading standings...</div>
              ) : eventLeaderboard.length === 0 ? (
                <div className="p-6 rounded-2xl bg-white/5 text-center text-xs text-slate-400">
                  No attempts recorded yet. Share the event link with students to start!
                </div>
              ) : (
                <div className="border border-violet-500/20 rounded-2xl overflow-hidden divide-y divide-violet-500/10">
                  <div className="grid grid-cols-12 px-3 py-2 bg-white/5 text-[11px] font-mono font-bold text-slate-400">
                    <span className="col-span-2">Rank</span>
                    <span className="col-span-5">Candidate</span>
                    <span className="col-span-3 text-right">Score</span>
                    <span className="col-span-2 text-right">Time</span>
                  </div>

                  {eventLeaderboard.map((row) => (
                    <div
                      key={row.rank}
                      className="grid grid-cols-12 px-3 py-2.5 text-xs items-center hover:bg-white/5 transition-colors"
                    >
                      <div className="col-span-2 font-mono font-bold">
                        {row.rank === 1 && <span className="text-amber-400">🥇 #1</span>}
                        {row.rank === 2 && <span className="text-slate-300">🥈 #2</span>}
                        {row.rank === 3 && <span className="text-amber-600">🥉 #3</span>}
                        {row.rank > 3 && <span className="text-slate-400">#{row.rank}</span>}
                      </div>
                      <div className="col-span-5 font-medium text-white truncate">
                        {row.displayName}
                      </div>
                      <div className="col-span-3 text-right font-mono font-bold text-teal-300">
                        {row.score}/{row.total} ({row.percentage}%)
                      </div>
                      <div className="col-span-2 text-right font-mono text-slate-400 text-[11px]">
                        {Math.floor(row.timeTakenSeconds / 60)}m {row.timeTakenSeconds % 60}s
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-violet-500/20">
              <button
                onClick={() => handleShareLink(viewingEvent.id)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Link</span>
              </button>

              <div className="flex items-center gap-2">
                {viewingEvent.status === 'live' && (
                  <button
                    onClick={async () => {
                      if (confirm('Close this event? It will move to Ended status.')) {
                        await closeCrewEvent(viewingEvent.id);
                        setViewingEvent(null);
                        loadEvents();
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-bold cursor-pointer"
                  >
                    Close Event
                  </button>
                )}

                <button
                  onClick={() => {
                    if (onOpenPublicEvent) onOpenPublicEvent(viewingEvent.id);
                    else window.open(`/events/${viewingEvent.id}`, '_blank');
                  }}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-violet-600/30"
                >
                  <span>Public View</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

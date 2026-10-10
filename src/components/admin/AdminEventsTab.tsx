import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Zap,
  Calendar,
  Clock,
  Plus,
  Users,
  Lock,
  Sparkles,
  CheckCircle2,
  Trash2,
  Edit2,
  RefreshCw,
  X,
  Play,
  Share2,
  Filter,
} from 'lucide-react';

export interface PlatformEvent {
  id: string;
  type: 'blitz' | 'arena';
  title: string;
  description: string;
  tierGating: 'all' | 'pro_and_above' | 'premium_only';
  subject: string;
  targetClass: string;
  questionCount: number;
  durationMinutes: number;
  scheduledAt: string;
  status: 'draft' | 'scheduled' | 'published' | 'live' | 'completed';
  registeredCount: number;
  createdBy: string;
  createdAt: string;
}

interface AdminEventsTabProps {
  currentUserEmail?: string;
}

export const AdminEventsTab: React.FC<AdminEventsTabProps> = ({
  currentUserEmail = 'shsvirtualadmin@gmail.com',
}) => {
  const [events, setEvents] = useState<PlatformEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'blitz' | 'arena'>('all');

  // Create / Edit Event Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);

  const [formType, setFormType] = useState<'blitz' | 'arena'>('blitz');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSubject, setFormSubject] = useState('Physics');
  const [formTargetClass, setFormTargetClass] = useState('FBISE 11 & Entrance');
  const [formQuestionCount, setFormQuestionCount] = useState<number>(20);
  const [formDurationMinutes, setFormDurationMinutes] = useState<number>(15);
  const [formScheduledDate, setFormScheduledDate] = useState('');
  const [formScheduledTime, setFormScheduledTime] = useState('16:00');
  const [formTierGating, setFormTierGating] = useState<'all' | 'pro_and_above' | 'premium_only'>('all');

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/events?adminEmail=${encodeURIComponent(currentUserEmail)}`, {
        headers: { 'x-admin-email': currentUserEmail },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [currentUserEmail]);

  const handleOpenCreate = (type: 'blitz' | 'arena') => {
    setModalMode('create');
    setFormType(type);
    if (type === 'blitz') {
      setFormTitle('Boardly Blitz: Live Speed Drill');
      setFormDescription('Rapid-fire 15-minute speed drill testing board and entrance concepts under timed pressure.');
      setFormSubject('Physics');
      setFormQuestionCount(20);
      setFormDurationMinutes(15);
      setFormTierGating('all');
    } else {
      setFormTitle('Boardly Arena: National Grand Mock 2026');
      setFormDescription('Statewide grand mock exam replicating full entrance test conditions with negative marking.');
      setFormSubject('Full Entrance Mock');
      setFormQuestionCount(100);
      setFormDurationMinutes(120);
      setFormTierGating('pro_and_above');
    }
    const nextSunday = new Date();
    nextSunday.setDate(nextSunday.getDate() + ((7 - nextSunday.getDay()) % 7 || 7));
    setFormScheduledDate(nextSunday.toISOString().split('T')[0]);
    setShowModal(true);
  };

  const handleOpenEdit = (event: PlatformEvent) => {
    setModalMode('edit');
    setCurrentEventId(event.id);
    setFormType(event.type);
    setFormTitle(event.title);
    setFormDescription(event.description);
    setFormSubject(event.subject);
    setFormTargetClass(event.targetClass);
    setFormQuestionCount(event.questionCount);
    setFormDurationMinutes(event.durationMinutes);
    setFormTierGating(event.tierGating);
    if (event.scheduledAt) {
      const d = new Date(event.scheduledAt);
      setFormScheduledDate(d.toISOString().split('T')[0]);
      setFormScheduledTime(d.toTimeString().substring(0, 5));
    }
    setShowModal(true);
  };

  const handleSaveEvent = async () => {
    if (!formTitle.trim()) return;
    setSaving(true);
    try {
      const scheduledAtIso = new Date(`${formScheduledDate || new Date().toISOString().split('T')[0]}T${formScheduledTime || '16:00'}:00.000Z`).toISOString();

      if (modalMode === 'create') {
        const res = await fetch('/api/admin/events/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-email': currentUserEmail,
          },
          body: JSON.stringify({
            type: formType,
            title: formTitle,
            description: formDescription,
            tierGating: formTierGating,
            subject: formSubject,
            targetClass: formTargetClass,
            questionCount: formQuestionCount,
            durationMinutes: formDurationMinutes,
            scheduledAt: scheduledAtIso,
            adminEmail: currentUserEmail,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setToast({ type: 'success', message: `${formType === 'blitz' ? 'Boardly Blitz Live Drill' : 'Boardly Arena Grand Mock'} published successfully!` });
          setShowModal(false);
          fetchEvents();
        } else {
          setToast({ type: 'error', message: data.error || 'Failed to create event.' });
        }
      } else {
        const res = await fetch('/api/admin/events/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-email': currentUserEmail,
          },
          body: JSON.stringify({
            id: currentEventId,
            updates: {
              title: formTitle,
              description: formDescription,
              tierGating: formTierGating,
              subject: formSubject,
              targetClass: formTargetClass,
              questionCount: formQuestionCount,
              durationMinutes: formDurationMinutes,
              scheduledAt: scheduledAtIso,
            },
            adminEmail: currentUserEmail,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setToast({ type: 'success', message: 'Event details updated.' });
          setShowModal(false);
          fetchEvents();
        } else {
          setToast({ type: 'error', message: data.error || 'Failed to update event.' });
        }
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message || 'Server error saving event.' });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handleLaunchNow = async (event: PlatformEvent) => {
    try {
      const res = await fetch('/api/admin/events/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': currentUserEmail,
        },
        body: JSON.stringify({
          id: event.id,
          updates: { status: 'live' },
          adminEmail: currentUserEmail,
        }),
      });
      if (res.ok) {
        setToast({ type: 'success', message: `🚀 ${event.title} is now LIVE for students!` });
        fetchEvents();
      }
    } catch {}
    setTimeout(() => setToast(null), 4000);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      const res = await fetch(`/api/admin/events/${id}?adminEmail=${encodeURIComponent(currentUserEmail)}`, {
        method: 'DELETE',
        headers: { 'x-admin-email': currentUserEmail },
      });
      if (res.ok) {
        setToast({ type: 'success', message: 'Event removed.' });
        fetchEvents();
      }
    } catch {}
    setTimeout(() => setToast(null), 4000);
  };

  const filteredEvents = events.filter((ev) => filterType === 'all' || ev.type === filterType);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold border shadow-lg ${
            toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner & Event Launcher Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Blitz Action Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 text-white shadow-xl flex flex-col justify-between space-y-4 relative overflow-hidden">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-black uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Speed & Accuracy Drills</span>
            </div>
            <h3 className="text-2xl font-black font-poppins">Boardly Blitz</h3>
            <p className="text-xs text-white/80 leading-relaxed max-w-sm">
              Schedule rapid-fire 15-minute live drills with live countdown timer and instant student rank distribution.
            </p>
          </div>
          <button
            onClick={() => handleOpenCreate('blitz')}
            className="w-full sm:w-auto self-start px-5 py-2.5 rounded-xl bg-white text-violet-900 font-extrabold text-xs shadow-md hover:bg-slate-100 transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4 text-violet-700" />
            <span>Schedule Boardly Blitz</span>
          </button>
        </div>

        {/* Arena Action Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl flex flex-col justify-between space-y-4 relative overflow-hidden border border-slate-800">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-wider border border-emerald-500/30">
              <Trophy className="w-3.5 h-3.5 text-emerald-400" />
              <span>Full-Scale Grand Mocks</span>
            </div>
            <h3 className="text-2xl font-black font-poppins">Boardly Arena</h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
              Configure and publish official nationwide grand mocks (100–200 MCQs) with tiered entry rules and percentiles.
            </p>
          </div>
          <button
            onClick={() => handleOpenCreate('arena')}
            className="w-full sm:w-auto self-start px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-md transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Configure Boardly Arena</span>
          </button>
        </div>
      </div>

      {/* Events List & Management Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <h4 className="text-base font-black text-slate-900">
              Scheduled Platform Events ({filteredEvents.length})
            </h4>
            <button
              onClick={fetchEvents}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              title="Refresh events"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex items-center rounded-xl bg-slate-100 p-0.5 text-xs font-bold text-slate-600">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filterType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              All Events
            </button>
            <button
              onClick={() => setFilterType('blitz')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filterType === 'blitz' ? 'bg-white text-violet-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Blitz Drills
            </button>
            <button
              onClick={() => setFilterType('arena')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filterType === 'arena' ? 'bg-white text-emerald-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Arena Mocks
            </button>
          </div>
        </div>

        {/* Event Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEvents.length === 0 ? (
            <div className="col-span-2 py-12 text-center text-slate-400 text-xs">
              No platform events scheduled yet. Click &quot;Schedule Boardly Blitz&quot; or &quot;Configure Boardly Arena&quot; above to create one.
            </div>
          ) : (
            filteredEvents.map((ev) => {
              const isLive = ev.status === 'live';
              const isBlitz = ev.type === 'blitz';

              return (
                <div
                  key={ev.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isLive
                      ? 'border-red-400 bg-red-50/20 shadow-md ring-2 ring-red-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            isBlitz ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {isBlitz ? 'Blitz Drill' : 'Arena Grand Mock'}
                        </span>
                        {isLive ? (
                          <span className="flex items-center gap-1 text-[10px] font-black text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" /> LIVE NOW
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full capitalize">
                            {ev.status}
                          </span>
                        )}
                      </div>
                      <h5 className="text-base font-extrabold text-slate-900">{ev.title}</h5>
                      <p className="text-xs text-slate-500 line-clamp-2">{ev.description}</p>
                    </div>

                    {/* Tier Gating Badge */}
                    <div className="shrink-0 text-right">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          ev.tierGating === 'premium_only'
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                            : ev.tierGating === 'pro_and_above'
                            ? 'bg-violet-50 border-violet-200 text-violet-700'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        {ev.tierGating === 'all' ? (
                          <span>All Tiers</span>
                        ) : (
                          <>
                            <Lock className="w-2.5 h-2.5" />
                            <span>{ev.tierGating === 'premium_only' ? 'Premium Only' : 'Pro & Above'}</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Meta Specs */}
                  <div className="grid grid-cols-3 gap-2 py-3 my-3 border-y border-slate-100 text-[11px] text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Subject</span>
                      <strong className="text-slate-800">{ev.subject}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Test Size</span>
                      <strong className="text-slate-800">{ev.questionCount} MCQs • {ev.durationMinutes}m</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Registered</span>
                      <strong className="text-slate-800">{ev.registeredCount} students</strong>
                    </div>
                  </div>

                  {/* Schedule Time & Action Buttons */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(ev.scheduledAt).toLocaleDateString()} at {new Date(ev.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!isLive && (
                        <button
                          onClick={() => handleLaunchNow(ev)}
                          className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-black text-xs transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Play className="w-3 h-3 fill-white" />
                          <span>Launch Live</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenEdit(ev)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                        title="Edit event"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(ev.id)}
                        className="p-1.5 rounded-lg border border-slate-200 text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                        title="Delete event"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Create / Edit Event Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-violet-600 bg-violet-50 px-2.5 py-0.5 rounded-full border border-violet-100">
                  {formType === 'blitz' ? 'Boardly Blitz' : 'Boardly Arena'}
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  {modalMode === 'create' ? 'Create & Schedule Event' : 'Edit Event Parameters'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Event Title */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Event Title</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Boardly Blitz: Speed Mechanics Round 1"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Description / Syllabus Scope</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Details for students..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                />
              </div>

              {/* Subject & Target Class */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Subject</label>
                  <select
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Physics">Physics</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Biology">Biology</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="English">English</option>
                    <option value="Full Entrance Mock">Full Entrance Mock</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Target Audience</label>
                  <input
                    type="text"
                    value={formTargetClass}
                    onChange={(e) => setFormTargetClass(e.target.value)}
                    placeholder="e.g. FBISE 11, MDCAT, NET"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              {/* Questions & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Number of MCQs</label>
                  <input
                    type="number"
                    value={formQuestionCount}
                    onChange={(e) => setFormQuestionCount(Number(e.target.value))}
                    min={5}
                    max={200}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={formDurationMinutes}
                    onChange={(e) => setFormDurationMinutes(Number(e.target.value))}
                    min={5}
                    max={180}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              {/* Schedule Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Scheduled Date</label>
                  <input
                    type="date"
                    value={formScheduledDate}
                    onChange={(e) => setFormScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Time (PKT)</label>
                  <input
                    type="time"
                    value={formScheduledTime}
                    onChange={(e) => setFormScheduledTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              {/* Tier Gating */}
              <div className="space-y-1.5 pt-1">
                <label className="font-bold text-slate-700 block">
                  Subscription Tier Access Control (Gating)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormTierGating('all')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      formTierGating === 'all'
                        ? 'border-slate-800 bg-slate-50 font-black text-slate-900 ring-1 ring-slate-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    All Students (Free)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormTierGating('pro_and_above')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      formTierGating === 'pro_and_above'
                        ? 'border-violet-600 bg-violet-50 font-black text-violet-900 ring-1 ring-violet-600'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Pro & Above
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormTierGating('premium_only')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      formTierGating === 'premium_only'
                        ? 'border-indigo-600 bg-indigo-50 font-black text-indigo-900 ring-1 ring-indigo-600'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Premium Only
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEvent}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-black shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {saving ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>{saving ? 'Saving...' : modalMode === 'create' ? 'Publish Event' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

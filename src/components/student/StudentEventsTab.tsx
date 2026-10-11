import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  Zap,
  Swords,
  Users,
  Clock,
  Award,
  ChevronRight,
  CheckCircle,
  Share2,
  Download,
  AlertCircle,
  Search,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { INITIAL_SESSIONS, EventSession, LeaderboardEntry } from '../../data/eventsStore';
import { Badge } from '../ui/Badge';
import { StatusPill } from '../ui/StatusPill';
import { Modal } from '../ui/Modal';
import { Tabs } from '../ui/Tabs';

interface StudentEventsTabProps {
  onStartEventTest: (session: EventSession) => void;
}

export const StudentEventsTab: React.FC<StudentEventsTabProps> = ({ onStartEventTest }) => {
  const { user, profile } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'upcoming' | 'my_registrations' | 'leaderboards' | 'circles'>('upcoming');
  const [selectedSession, setSelectedSession] = useState<EventSession | null>(null);
  const [showLobbyModal, setShowLobbyModal] = useState<boolean>(false);
  const [lobbySession, setLobbySession] = useState<EventSession | null>(null);
  const [circleCodeInput, setCircleCodeInput] = useState<string>('');
  const [joinedCircles, setJoinedCircles] = useState<string[]>(['FSC Pre-Medical Islamabad Circle', 'NUST NET Aspirants 2026']);
  const [circleSuccessMsg, setCircleSuccessMsg] = useState<string>('');

  // Local state for registered sessions
  const [registeredIds, setRegisteredIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`boardly_registered_events_${user?.uid || 'guest'}`);
      return saved ? JSON.parse(saved) : ['arena-nat-01'];
    } catch {
      return ['arena-nat-01'];
    }
  });

  const handleRegister = (session: EventSession) => {
    if (!registeredIds.includes(session.id)) {
      const updated = [...registeredIds, session.id];
      setRegisteredIds(updated);
      try {
        localStorage.setItem(`boardly_registered_events_${user?.uid || 'guest'}`, JSON.stringify(updated));
      } catch {}
    }
    setSelectedSession(session);
  };

  const handleOpenLobby = (session: EventSession) => {
    setLobbySession(session);
    setShowLobbyModal(true);
  };

  const myRegisteredSessions = useMemo(() => {
    return INITIAL_SESSIONS.filter((s) => registeredIds.includes(s.id));
  }, [registeredIds]);

  const upcomingSessions = useMemo(() => {
    return INITIAL_SESSIONS.filter((s) => s.status !== 'ended');
  }, []);

  const handleJoinCircle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!circleCodeInput.trim()) return;
    const name = `Circle #${circleCodeInput.trim().toUpperCase()}`;
    if (!joinedCircles.includes(name)) {
      setJoinedCircles([...joinedCircles, name]);
      setCircleSuccessMsg(`Successfully joined ${name}!`);
      setTimeout(() => setCircleSuccessMsg(''), 3000);
    }
    setCircleCodeInput('');
  };

  // Download simple .ics calendar file
  const downloadIcs = (session: EventSession) => {
    const startDate = new Date(session.startTime).toISOString().replace(/-|:|\.\d+/g, '');
    const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Boardly//Events//EN\nBEGIN:VEVENT\nSUMMARY:${session.title}\nDESCRIPTION:Boardly competitive session\nDTSTART:${startDate}\nSTATUS:CONFIRMED\nEND:VEVENT\nEND:VCALENDAR`;
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${session.id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Boardly Events & Circles
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Compete in live Boardly Blitz speed drills, Boardly Arena grand national mocks, and Study Circle sessions.
        </p>
      </div>

      {/* Sub Tabs */}
      <Tabs
        activeTab={activeSubTab}
        onChange={(tab) => setActiveSubTab(tab as any)}
        tabs={[
          { id: 'upcoming', label: 'Upcoming Sessions' },
          { id: 'my_registrations', label: `My Registrations (${registeredIds.length})` },
          { id: 'leaderboards', label: 'National Leaderboards' },
          { id: 'circles', label: 'Study Circles' },
        ]}
      />

      {/* 1. Upcoming Sessions */}
      {activeSubTab === 'upcoming' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {upcomingSessions.map((session) => {
            const isRegistered = registeredIds.includes(session.id);
            const isLive = session.status === 'live';

            return (
              <div
                key={session.id}
                className="p-5 sm:p-6 rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-300 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant={session.type === 'blitz' ? 'amber' : 'violet'}>
                      {session.type === 'blitz' ? 'Boardly Blitz' : 'Boardly Arena'}
                    </Badge>
                    <StatusPill status={session.status} />
                  </div>

                  <h3 className="font-extrabold text-base text-slate-900 leading-snug">
                    {session.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2">
                    {session.description || 'Timed national simulation with real-time accuracy scoring.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1">
                    <span className="flex items-center gap-1 font-semibold">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {session.durationMinutes} mins
                    </span>
                    <span className="flex items-center gap-1 font-semibold">
                      <Award className="w-3.5 h-3.5 text-slate-400" />
                      {session.totalQuestions} Questions
                    </span>
                    <span className="flex items-center gap-1 font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(session.startTime).toLocaleDateString('en-PK', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  {isRegistered ? (
                    <>
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                        <CheckCircle className="w-4 h-4" />
                        Registered
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenLobby(session)}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                      >
                        {isLive ? 'Join Live Now' : 'Enter Lobby'}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => downloadIcs(session)}
                        className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                      >
                        Add to Calendar (.ics)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRegister(session)}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
                      >
                        Register Free
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. My Registrations */}
      {activeSubTab === 'my_registrations' && (
        <div className="space-y-4">
          {myRegisteredSessions.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 text-slate-400 text-xs">
              You have not registered for any events yet. Check out upcoming sessions to register!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myRegisteredSessions.map((session) => (
                <div
                  key={session.id}
                  className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="indigo">{session.subject}</Badge>
                    <StatusPill status={session.status} />
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    {session.title}
                  </h4>
                  <div className="text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
                    <span>
                      {new Date(session.startTime).toLocaleString('en-PK', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenLobby(session)}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs cursor-pointer hover:bg-indigo-700"
                    >
                      Enter Session
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. National Leaderboards */}
      {activeSubTab === 'leaderboards' && (
        <div className="rounded-3xl bg-white/95 border border-slate-200/90 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-black text-base text-slate-900">
                Arena Grand Mock #08 Leaderboard
              </h3>
              <p className="text-xs text-slate-400">
                Ranked by highest score, then fastest completion time. Names privacy protected.
              </p>
            </div>
            <Badge variant="violet">Verified Results</Badge>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {[
              { rank: 1, name: 'Hamza A.', score: 98, time: '32m 14s', uni: 'NUST', isYou: false },
              { rank: 2, name: 'Ayesha M.', score: 96, time: '34m 50s', uni: 'FAST', isYou: false },
              { rank: 3, name: 'Zain K.', score: 94, time: '31m 20s', uni: 'GIKI', isYou: true },
              { rank: 4, name: 'Bilal R.', score: 92, time: '38m 05s', uni: 'IBA', isYou: false },
              { rank: 5, name: 'Fatima S.', score: 90, time: '35m 12s', uni: 'UHS', isYou: false },
            ].map((entry) => (
              <div
                key={entry.rank}
                className={`py-3 px-3 flex items-center justify-between rounded-xl ${
                  entry.isYou ? 'bg-indigo-50 font-bold' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${
                      entry.rank === 1
                        ? 'bg-amber-400 text-amber-950'
                        : entry.rank === 2
                        ? 'bg-slate-300 text-slate-800'
                        : entry.rank === 3
                        ? 'bg-amber-600 text-white'
                        : 'text-slate-400'
                    }`}
                  >
                    {entry.rank}
                  </span>
                  <span className="font-extrabold text-slate-900">
                    {entry.name} {entry.isYou && <span className="text-[10px] text-indigo-600">(You)</span>}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-slate-600">
                  <span>Target: {entry.uni}</span>
                  <span className="font-mono text-slate-400">{entry.time}</span>
                  <span className="font-black text-indigo-600">{entry.score}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Study Circles */}
      {activeSubTab === 'circles' && (
        <div className="space-y-5">
          <div className="p-6 rounded-3xl bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-transparent border border-teal-200/80 space-y-4">
            <h3 className="font-black text-lg text-slate-900">
              Join a Study Circle
            </h3>
            <p className="text-xs text-slate-600 max-w-lg leading-relaxed">
              Study Circles are organized by students and academy captains to study chapters together and hold private mock exams.
            </p>
            <form onSubmit={handleJoinCircle} className="flex gap-2 max-w-md">
              <input
                type="text"
                value={circleCodeInput}
                onChange={(e) => setCircleCodeInput(e.target.value)}
                placeholder="Enter invite code (e.g. FSC2026)"
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
              >
                Join Circle
              </button>
            </form>
            {circleSuccessMsg && (
              <p className="text-xs font-bold text-emerald-600">{circleSuccessMsg}</p>
            )}
          </div>

          <div className="space-y-3">
            <h4 className="font-extrabold text-sm text-slate-900">
              My Circles ({joinedCircles.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {joinedCircles.map((circleName) => (
                <div
                  key={circleName}
                  className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-black">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-extrabold text-xs text-slate-900">
                        {circleName}
                      </p>
                      <p className="text-[10px] text-slate-400">Weekly competitive drills</p>
                    </div>
                  </div>
                  <Badge variant="teal" size="xs">
                    Active
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Lobby Modal */}
      {showLobbyModal && lobbySession && (
        <Modal
          isOpen={showLobbyModal}
          onClose={() => setShowLobbyModal(false)}
          title={lobbySession.title}
          subtitle="Pre-Test Lobby & Device Check"
        >
          <div className="space-y-4 text-xs text-slate-600">
            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 space-y-1">
              <p className="font-black">Session Rules & Instructions:</p>
              <ul className="list-disc ml-4 space-y-1 text-[11px]">
                <li>Duration: {lobbySession.durationMinutes} minutes.</li>
                <li>Server-timed: timer runs continuously once started.</li>
                <li>One attempt only. Autosaves answers periodically.</li>
                <li>Tab switching is recorded in proctoring logs.</li>
              </ul>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-semibold">Device & Connection Status</span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Ready
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowLobbyModal(false);
                onStartEventTest(lobbySession);
              }}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
            >
              Start Session Now
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

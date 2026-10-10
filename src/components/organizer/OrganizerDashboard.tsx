import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AppShell } from '../ui/AppShell';
import { StatCard } from '../ui/StatCard';
import { DataTable } from '../ui/DataTable';
import { StatusPill } from '../ui/StatusPill';
import { Stepper } from '../ui/Stepper';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { SparkLineTrendChart } from '../ui/Charts';
import {
  Calendar,
  Users,
  Target,
  TrendingUp,
  Plus,
  Copy,
  Check,
  Clock,
  Award,
  Share2,
  FileText,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';

export const OrganizerDashboard: React.FC = () => {
  const { user, profile, logOut } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [copiedLink, setCopiedLink] = useState(false);

  // Create Session Wizard State
  const [wizardStep, setWizardStep] = useState<number>(0);
  const [sessionType, setSessionType] = useState<'blitz' | 'arena'>('blitz');
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionSubject, setSessionSubject] = useState('Advance Maths');
  const [sessionDuration, setSessionDuration] = useState(30);
  const [sessionQuestions, setSessionQuestions] = useState(30);
  const [sessionVisibility, setSessionVisibility] = useState<'public' | 'invite_only'>('invite_only');
  const [sessionCreatedSuccess, setSessionCreatedSuccess] = useState(false);

  // Mock sessions created by this organizer
  const [sessions, setSessions] = useState([
    {
      id: 'sess-01',
      title: 'KPK Board Integration Drill #01',
      type: 'blitz',
      subject: 'Mathematics',
      scheduledAt: '2026-10-14 18:00 PKT',
      duration: '30 mins',
      registeredCount: 42,
      status: 'scheduled',
    },
    {
      id: 'sess-02',
      title: 'Pre-Medical Biology Biomolecules Mega Mock',
      type: 'arena',
      subject: 'Biology',
      scheduledAt: '2026-10-18 20:00 PKT',
      duration: '45 mins',
      registeredCount: 88,
      status: 'pending',
    },
    {
      id: 'sess-03',
      title: 'Newtonian Physics Sprints',
      type: 'blitz',
      subject: 'Physics',
      scheduledAt: '2026-10-09 19:00 PKT',
      duration: '25 mins',
      registeredCount: 65,
      status: 'ended',
    },
  ]);

  const handleCopyInviteLink = (id: string) => {
    navigator.clipboard.writeText(`https://boardly.cfd/events/join?session=${id}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCreateSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newSession = {
      id: `sess-${Date.now()}`,
      title: sessionTitle || 'New Circle Session',
      type: sessionType,
      subject: sessionSubject,
      scheduledAt: 'Tomorrow 18:00 PKT',
      duration: `${sessionDuration} mins`,
      registeredCount: 1,
      status: 'pending',
    };
    setSessions([newSession, ...sessions]);
    setSessionCreatedSuccess(true);
    setTimeout(() => {
      setSessionCreatedSuccess(false);
      setWizardStep(0);
      setActiveTab('sessions');
    }, 2000);
  };

  return (
    <AppShell
      role="organizer"
      title="Study Circles Organizer Portal"
      subtitle="Schedule private test sessions, track your cohorts, and view student progress"
      activeNav={activeTab}
      onSelectNav={(id) => setActiveTab(id)}
      onLogout={logOut}
    >
      {/* 1. OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Sessions Run"
              value={sessions.length}
              subtitle="All time total"
              accent="teal"
              icon={<Calendar className="w-5 h-5 text-teal-600" />}
            />
            <StatCard
              label="Active Participants"
              value="195"
              subtitle="Across your circles"
              accent="teal"
              icon={<Users className="w-5 h-5 text-teal-600" />}
            />
            <StatCard
              label="Avg Cohort Score"
              value="74.2%"
              subtitle="+6% vs provincial mean"
              accent="teal"
              icon={<Award className="w-5 h-5 text-teal-600" />}
            />
            <StatCard
              label="Upcoming Session"
              value="Oct 14"
              subtitle="42 registered"
              accent="teal"
              icon={<Clock className="w-5 h-5 text-teal-600" />}
            />
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Cohort Performance Velocity
                </h3>
                <p className="text-xs text-slate-400">Mean accuracy progression per weekly session</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('create_session')}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-500/20 cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Create Session</span>
              </button>
            </div>
            <SparkLineTrendChart
              data={[
                { label: 'W1', value: 58 },
                { label: 'W2', value: 64 },
                { label: 'W3', value: 71 },
                { label: 'W4', value: 78 },
              ]}
              color="#0D9488"
              height={180}
            />
          </div>
        </div>
      )}

      {/* 2. MY SESSIONS */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-lg text-slate-900 dark:text-white">
              My Circle Sessions
            </h3>
            <button
              type="button"
              onClick={() => setActiveTab('create_session')}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>New Session</span>
            </button>
          </div>

          <DataTable
            data={sessions}
            keyExtractor={(s) => s.id}
            columns={[
              {
                key: 'title',
                header: 'Title & Format',
                render: (s) => (
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">{s.title}</span>
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                      {s.type} · {s.subject}
                    </span>
                  </div>
                ),
              },
              { key: 'scheduledAt', header: 'Scheduled Time' },
              { key: 'duration', header: 'Duration' },
              {
                key: 'registeredCount',
                header: 'Participants',
                render: (s) => <span className="font-extrabold">{s.registeredCount} students</span>,
              },
              {
                key: 'status',
                header: 'Status',
                render: (s) => <StatusPill status={s.status} />,
              },
              {
                key: 'actions',
                header: 'Actions',
                render: (s) => (
                  <button
                    type="button"
                    onClick={() => handleCopyInviteLink(s.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-teal-50 transition-colors cursor-pointer"
                    title="Copy invite link"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                ),
              },
            ]}
          />
        </div>
      )}

      {/* 3. CREATE SESSION WIZARD */}
      {activeTab === 'create_session' && (
        <div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-md space-y-6">
          <div className="space-y-1">
            <h3 className="font-black text-xl text-slate-900 dark:text-white">
              Create a Competitive Circle Session
            </h3>
            <p className="text-xs text-slate-400">
              Set up timed drills for your academy students or study circle members.
            </p>
          </div>

          <Stepper
            accent="teal"
            currentStep={wizardStep}
            onStepClick={(step) => setWizardStep(step)}
            steps={[
              { id: 0, title: 'Format & Type' },
              { id: 1, title: 'Details & Timing' },
              { id: 2, title: 'Questions & Rules' },
            ]}
          />

          {sessionCreatedSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                Session Submitted for Approval!
              </h4>
              <p className="text-xs text-slate-500">
                Admins review community sessions to ensure curriculum fidelity. Once approved, your invite link goes live.
              </p>
            </div>
          ) : (
            <form onSubmit={handleCreateSessionSubmit} className="space-y-5 text-xs">
              {wizardStep === 0 && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">
                      Session Style
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setSessionType('blitz')}
                        className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                          sessionType === 'blitz'
                            ? 'border-teal-600 bg-teal-50/50 text-teal-900 dark:bg-teal-950/40 dark:text-white'
                            : 'border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <p className="font-extrabold text-sm">Blitz Drill</p>
                        <p className="text-[11px] text-slate-500 mt-1">High intensity 20-30 min speed practice.</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSessionType('arena')}
                        className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                          sessionType === 'arena'
                            ? 'border-violet-600 bg-violet-50/50 text-violet-900 dark:bg-violet-950/40 dark:text-white'
                            : 'border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <p className="font-extrabold text-sm">Arena Full Mock</p>
                        <p className="text-[11px] text-slate-500 mt-1">Grand 45-60 min test with negative marking.</p>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Subject
                    </label>
                    <select
                      value={sessionSubject}
                      onChange={(e) => setSessionSubject(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-bold"
                    >
                      <option value="Advance Maths">Advance Mathematics (FSC / NUST)</option>
                      <option value="Physics">Physics (Mechanics & Electromagnetism)</option>
                      <option value="Chemistry">Chemistry (Organic & Physical)</option>
                      <option value="Biology">Biology (MDCAT Syllabus)</option>
                      <option value="English">English Verbal & Comprehension</option>
                    </select>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setWizardStep(1)}
                      className="px-5 py-2.5 rounded-xl bg-teal-600 text-white font-bold cursor-pointer"
                    >
                      Next: Details →
                    </button>
                  </div>
                </div>
              )}

              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Session Title
                    </label>
                    <input
                      type="text"
                      value={sessionTitle}
                      onChange={(e) => setSessionTitle(e.target.value)}
                      placeholder="e.g. Chapter 4 & 5 Mock Challenge"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-bold"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Duration (minutes)
                      </label>
                      <input
                        type="number"
                        value={sessionDuration}
                        onChange={(e) => setSessionDuration(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-bold"
                        min={10}
                        max={120}
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Question Count
                      </label>
                      <input
                        type="number"
                        value={sessionQuestions}
                        onChange={(e) => setSessionQuestions(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-bold"
                        min={10}
                        max={100}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setWizardStep(0)}
                      className="px-4 py-2 rounded-xl text-slate-600 font-bold"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setWizardStep(2)}
                      className="px-5 py-2.5 rounded-xl bg-teal-600 text-white font-bold cursor-pointer"
                    >
                      Next: Rules & Publish →
                    </button>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Visibility
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setSessionVisibility('invite_only')}
                        className={`p-3 rounded-xl border text-left cursor-pointer ${
                          sessionVisibility === 'invite_only'
                            ? 'border-teal-600 bg-teal-50/50 text-teal-900'
                            : 'border-slate-200'
                        }`}
                      >
                        <p className="font-bold">Invite Only</p>
                        <p className="text-[10px] text-slate-400">Accessible only via private code.</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSessionVisibility('public')}
                        className={`p-3 rounded-xl border text-left cursor-pointer ${
                          sessionVisibility === 'public'
                            ? 'border-teal-600 bg-teal-50/50 text-teal-900'
                            : 'border-slate-200'
                        }`}
                      >
                        <p className="font-bold">Public</p>
                        <p className="text-[10px] text-slate-400">Listed on Boardly Events page.</p>
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      Summary Preview:
                    </p>
                    <p className="text-slate-500">
                      {sessionTitle || 'New Session'} · {sessionSubject} · {sessionDuration} mins · {sessionQuestions} MCQs
                    </p>
                  </div>

                  <div className="flex justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setWizardStep(1)}
                      className="px-4 py-2 rounded-xl text-slate-600 font-bold"
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold cursor-pointer shadow-md"
                    >
                      Submit for Approval
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      )}

      {/* 4. PARTICIPANTS */}
      {activeTab === 'participants' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-lg text-slate-900 dark:text-white">
                Cohort Participants
              </h3>
              <p className="text-xs text-slate-400">
                Privacy-safe: emails and phone numbers are hidden by default.
              </p>
            </div>
          </div>

          <DataTable
            data={[
              { id: '1', name: 'Zainab K.', school: 'Army Public School', registeredAt: 'Yesterday', testsFinished: 4, avgScore: '82%' },
              { id: '2', name: 'Ahmed M.', school: 'F.G. Sir Syed College', registeredAt: '2 days ago', testsFinished: 3, avgScore: '76%' },
              { id: '3', name: 'Saad R.', school: 'Punjab College Islamabad', registeredAt: '3 days ago', testsFinished: 5, avgScore: '88%' },
              { id: '4', name: 'Hira T.', school: 'KIPS Academy', registeredAt: '4 days ago', testsFinished: 2, avgScore: '69%' },
            ]}
            keyExtractor={(p) => p.id}
            columns={[
              { key: 'name', header: 'Student Name' },
              { key: 'school', header: 'Institution' },
              { key: 'registeredAt', header: 'Joined Circle' },
              { key: 'testsFinished', header: 'Tests Taken' },
              {
                key: 'avgScore',
                header: 'Mean Score',
                render: (p) => <span className="font-extrabold text-teal-600">{p.avgScore}</span>,
              },
            ]}
          />
        </div>
      )}

      {/* 5. RESOURCES & PROMOTIONAL POSTERS */}
      {activeTab === 'resources' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 flex items-center justify-center font-bold">
              <Share2 className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
              Official Session Posters
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Download WhatsApp and Instagram ready graphics stamped with your circle invite link.
            </p>
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-teal-50 text-teal-700 font-bold text-xs hover:bg-teal-100 transition-colors cursor-pointer"
            >
              Download Asset Pack
            </button>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
              How to Run an Effective Circle
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Curriculum alignment handbook, timing recommendations, and common mistake review guidelines.
            </p>
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              Read Handbook
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
};

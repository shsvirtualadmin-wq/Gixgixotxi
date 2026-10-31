import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useStudyCrew } from '@/hooks/useStudyCrew';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { RoleBadge } from '@/components/ui/RoleBadge';
import {
  Users,
  Radio,
  Clock,
  BookOpen,
  ArrowLeft,
  Send,
  MessageSquare,
} from 'lucide-react';
import { api } from '@/lib/api';

interface ActiveBuddy {
  uid: string;
  displayName: string;
  shortId: string;
  avatarKey?: string;
  lastActive: number;
  questionsSolvedThisSession?: number;
}

interface StudyBuddyLogItem {
  id: string;
  studentName: string;
  studentShortId: string;
  timestamp: string;
  questionsSolved: number;
  topic?: string;
}

interface StudyBuddyMessage {
  id: string;
  senderName: string;
  senderShortId: string;
  senderUid: string;
  senderRole?: string;
  senderCustomRole?: string;
  text: string;
  timestamp: string;
}

export function StudyBuddyPage() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { crew, loading: crewLoading } = useStudyCrew();

  const [activeBuddies, setActiveBuddies] = useState<ActiveBuddy[]>([]);
  const [sessionLogs, setSessionLogs] = useState<StudyBuddyLogItem[]>([]);
  const [messages, setMessages] = useState<StudyBuddyMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  const crewId = profile?.crewId || crew?.id;

  const fetchStudyBuddyState = useCallback(async () => {
    if (!crewId) return;
    try {
      const [presRes, logsRes, msgsRes] = await Promise.all([
        api.get<{ presence?: Array<Record<string, unknown>> }>(`/api/study-buddy/presence?crewId=${encodeURIComponent(crewId)}`).catch(() => ({ presence: [] })),
        api.get<{ logs?: Array<Record<string, unknown>> }>(`/api/study-buddy/logs?crewId=${encodeURIComponent(crewId)}`).catch(() => ({ logs: [] })),
        api.get<{ messages?: Array<Record<string, unknown>> }>(`/api/study-buddy/messages?crewId=${encodeURIComponent(crewId)}`).catch(() => ({ messages: [] })),
      ]);

      const now = Date.now();
      const list: ActiveBuddy[] = [];
      for (const data of presRes.presence || []) {
        const lastAct = Number(data.lastActive || 0);
        if (lastAct && now - lastAct < 90000) {
          const uid = String(data.uid || '');
          list.push({
            uid,
            displayName: String(data.displayName || 'Squad Member'),
            shortId: String(data.shortId || uid.slice(0, 5)),
            avatarKey: data.avatarKey as string | undefined,
            lastActive: lastAct,
            questionsSolvedThisSession: Number(data.questionsSolvedThisSession || 0),
          });
        }
      }
      setActiveBuddies(list);

      const logs: StudyBuddyLogItem[] = (logsRes.logs || []).map((d) => {
        let timeStr = 'Recently';
        if (typeof d.createdAt === 'string') {
          const dt = new Date(d.createdAt);
          if (!isNaN(dt.getTime())) {
            timeStr = dt.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
          }
        }
        return {
          id: String(d.id || ''),
          studentName: String(d.studentName || 'Student'),
          studentShortId: String(d.studentShortId || '00000'),
          timestamp: timeStr,
          questionsSolved: Number(d.questionsSolved || 0),
          topic: String(d.topic || 'General Practice'),
        };
      });
      setSessionLogs(logs);

      const msgs: StudyBuddyMessage[] = (msgsRes.messages || []).map((d) => {
        let timeStr = 'Now';
        if (typeof d.createdAt === 'string') {
          const dt = new Date(d.createdAt);
          if (!isNaN(dt.getTime())) {
            timeStr = dt.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
          }
        }
        return {
          id: String(d.id || ''),
          senderName: String(d.senderName || 'Student'),
          senderShortId: String(d.studentShortId || d.senderShortId || '00000'),
          senderUid: String(d.senderUid || ''),
          senderRole: String(d.senderRole || 'Student'),
          senderCustomRole: (d.senderCustomRole as string) || undefined,
          text: String(d.text || ''),
          timestamp: timeStr,
        };
      });
      setMessages(msgs);
    } catch (err) {
      console.warn('[StudyBuddy] Poll error:', err);
    }
  }, [crewId]);

  // 1. Presence Heartbeat & Polling
  useEffect(() => {
    if (!user || !crewId) return;

    const sendHeartbeat = async () => {
      try {
        await api.post('/api/study-buddy/presence', {
          crewId,
          uid: user.uid,
          displayName: profile?.displayName || user.displayName || 'Student',
          shortId: profile?.shortId || user.uid.slice(0, 5),
          lastActive: Date.now(),
          questionsSolvedThisSession: profile?.totalQuestionsSolved || 0,
        });
      } catch (err) {
        console.warn('[StudyBuddy] Presence heartbeat error:', err);
      }
    };

    sendHeartbeat().then(() => fetchStudyBuddyState());
    const hbInterval = setInterval(sendHeartbeat, 25000);
    const pollInterval = setInterval(fetchStudyBuddyState, 8000);

    return () => {
      clearInterval(hbInterval);
      clearInterval(pollInterval);
    };
  }, [user, crewId, profile, fetchStudyBuddyState]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !crewId || !newMessage.trim() || sendingMsg) return;

    setSendingMsg(true);
    try {
      await api.post('/api/study-buddy/messages', {
        crewId,
        senderUid: user.uid,
        senderName: profile?.displayName || user.displayName || 'Student',
        senderShortId: profile?.shortId || user.uid.slice(0, 5),
        senderRole: profile?.role || 'Student',
        senderCustomRole: profile?.customRole || null,
        text: newMessage.trim(),
      });
      setNewMessage('');
      await fetchStudyBuddyState();
    } catch (err) {
      console.warn('[StudyBuddy] Message send error:', err);
    } finally {
      setSendingMsg(false);
    }
  };

  const handleLogStudySession = async () => {
    if (!user || !crewId) return;
    const questionsSolved = prompt('How many MCQs did you solve in this sprint session?', '15');
    if (!questionsSolved) return;

    const num = parseInt(questionsSolved, 10);
    if (isNaN(num) || num <= 0) return;

    try {
      await api.post('/api/study-buddy/logs', {
        crewId,
        studentUid: user.uid,
        studentName: profile?.displayName || user.displayName || 'Student',
        studentShortId: profile?.shortId || user.uid.slice(0, 5),
        questionsSolved: num,
        topic: profile?.targetUniversity || 'General Practice',
      });
      await fetchStudyBuddyState();
    } catch (err) {
      console.warn('[StudyBuddy] Log session error:', err);
    }
  };

  if (crewLoading) {
    return (
      <div style={{ maxWidth: 840, margin: '2rem auto', padding: '1rem' }}>
        <Skeleton height={200} />
      </div>
    );
  }

  if (!crewId) {
    return (
      <div style={{ maxWidth: 640, margin: '3rem auto', padding: '1rem', textAlign: 'center' }}>
        <GlassCard style={{ padding: '32px 24px' }}>
          <Users size={36} className="mx-auto text-[var(--accent)] mb-3" />
          <h2 className="text-xl font-bold text-[var(--text)] font-display">Study Buddy (Squad Room)</h2>
          <p className="text-xs text-[var(--muted)] mt-1.5 max-w-md mx-auto leading-relaxed">
            Study Buddy allows synchronized study sessions with your crew peers. Form or join a squad first to unlock active presence, live study logs, and sprint chats.
          </p>
          <div className="pt-4 flex justify-center gap-3">
            <Link to="/dashboard/crew" className="btn-red px-5 py-2.5 text-xs font-bold">
              Join or Assemble a Crew
            </Link>
          </div>
        </GlassCard>
      </div>
    );
  }

  const isMultiUserStudying = activeBuddies.length >= 2;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24, padding: '1rem' }}>
      {/* Header */}
      <div>
        <Link
          to="/dashboard/crew"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-white mb-2 transition-colors font-heading"
        >
          <ArrowLeft size={14} />
          <span>Return to Squad Cockpit</span>
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge color="red">Live Sync</Badge>
              {isMultiUserStudying ? (
                <span className="text-[11px] font-mono font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  {activeBuddies.length} Peers In Session
                </span>
              ) : (
                <span className="text-[11px] font-mono text-[var(--text-faint)]">
                  {activeBuddies.length} member online
                </span>
              )}
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text)] tracking-tight">
              Study Buddy
            </h1>
            <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
              Synchronized study lounge for <strong>{crew?.name || 'Your Crew'}</strong>. Keep each other disciplined with live presence and shared sprint logs.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleLogStudySession}
            className="shrink-0 cursor-pointer"
          >
            <BookOpen size={14} />
            <span>Log Study Sprint</span>
          </Button>
        </div>
      </div>

      {/* ── Active Members Roster with "Studying Now" Indicator ── */}
      <GlassCard style={{ padding: '24px' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Radio size={16} className={isMultiUserStudying ? 'text-emerald-400 animate-pulse' : 'text-[var(--muted)]'} />
            <h3 className="text-base font-bold text-[var(--text)] font-display">
              Active Crew Members
            </h3>
          </div>
          <span className="text-xs font-mono text-[var(--text-faint)]">
            {activeBuddies.length} / {crew?.members?.length || 1} Present
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {activeBuddies.map((buddy) => {
            const isMe = buddy.uid === user?.uid;
            return (
              <div
                key={buddy.uid}
                className="p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[var(--card)] border border-[var(--border)] flex items-center justify-center font-bold text-[var(--text)] shrink-0">
                    {buddy.displayName[0]?.toUpperCase() || 'S'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[var(--text)] truncate">
                      {buddy.displayName} {isMe && <span className="text-[var(--accent)] font-normal">(You)</span>}
                    </p>
                    <span className="text-[10px] font-mono text-[var(--text-faint)]">
                      #{buddy.shortId}
                    </span>
                  </div>
                </div>

                {/* Requirement 12: When two or more crew members are on Study Buddy at the same time: Show "Studying Now" green indicator */}
                {isMultiUserStudying ? (
                  <span className="shrink-0 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Studying Now
                  </span>
                ) : (
                  <span className="shrink-0 text-[10px] font-mono text-[var(--text-faint)] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Online
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {!isMultiUserStudying && (
          <p className="text-[11px] text-[var(--text-faint)] mt-3 italic">
            Tip: When 2 or more squad members are on Study Buddy together, the green "Studying Now" indicator activates.
          </p>
        )}
      </GlassCard>

      {/* ── Two Columns: Shared Session Logs & Squad Motivation Chat ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Shared Study Session Logs */}
        <GlassCard style={{ padding: '24px' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-[#D71921]" />
              <h3 className="text-base font-bold text-[var(--text)] font-display">
                Shared Study Logs
              </h3>
            </div>
            <span className="text-xs font-mono text-[var(--text-faint)]">
              Real-Time PKT
            </span>
          </div>

          {sessionLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--muted)] bg-[var(--surface)] rounded-xl border border-[var(--border)] space-y-1">
              <p>No study sprint logs recorded yet today.</p>
              <p className="text-[11px] text-[var(--text-faint)]">Click "Log Study Sprint" above after completing a practice block!</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {sessionLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[var(--text)]">{log.studentName}</span>
                      <span className="text-[10px] font-mono text-[var(--muted)]">#{log.studentShortId}</span>
                    </div>
                    <span className="text-[11px] text-[var(--text-faint)] block mt-0.5">
                      {log.topic} · {log.timestamp}
                    </span>
                  </div>

                  <span className="font-mono font-bold text-xs px-2.5 py-1 rounded bg-[#D71921]/15 text-[#D71921] border border-[#D71921]/30">
                    +{log.questionsSolved} MCQs
                  </span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Squad Sprint Chat / Notes */}
        <GlassCard style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare size={16} className="text-amber-400" />
              <h3 className="text-base font-bold text-[var(--text)] font-display">
                Squad Motivation &amp; Chat
              </h3>
            </div>

            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 mb-4">
              {messages.length === 0 ? (
                <div className="p-6 text-center text-xs text-[var(--muted)] bg-[var(--surface)] rounded-xl border border-[var(--border)]">
                  Squad lounge is quiet. Send a message to rally your study peers!
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.senderUid === user?.uid;
                  return (
                    <div
                      key={m.id}
                      className={`p-2.5 rounded-xl text-xs max-w-[85%] ${
                        isMe
                          ? 'ml-auto bg-[#D71921]/20 border border-[#D71921]/40 text-white'
                          : 'bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1 text-[10px] font-mono text-[var(--text-faint)]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-sans font-bold text-[var(--text)]">{m.senderName}</span>
                          <span className="text-[10px] font-mono text-[var(--muted)]">#{m.senderShortId}</span>
                          <RoleBadge
                            role={m.senderRole || 'Student'}
                            customRole={m.senderCustomRole}
                            isSuperAdmin={
                              m.senderRole === 'superadmin' ||
                              m.senderRole === 'admin' ||
                              m.senderUid === 'A5YMRimdHRcmeDWutxtUGt2e4hf2'
                            }
                            size="sm"
                          />
                        </div>
                        <span>{m.timestamp}</span>
                      </div>
                      <p className="text-xs leading-relaxed">{m.text}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Post sprint update or note..."
              className="flex-1 px-3.5 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--text)] focus:outline-none focus:border-[#D71921]"
            />
            <Button variant="primary" size="sm" type="submit" loading={sendingMsg} className="shrink-0">
              <Send size={13} />
            </Button>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}

export default StudyBuddyPage;

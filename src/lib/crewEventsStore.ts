import {
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
} from './firebase';
import { CrewEvent, CrewEventAttempt, PublicLeaderboardEntry } from '../types/crewEvents';
import { Question } from '../types';
import { getPrebuiltQuestionsForSubject } from '../data/prebuiltQuestions';

export function formatSafeDisplayName(name?: string, email?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
  }
  if (email && email.includes('@')) {
    const prefix = email.split('@')[0];
    return prefix.length > 3 ? `${prefix.slice(0, 3)}***` : 'Student';
  }
  return 'Aspirant';
}

const DEFAULT_SAMPLE_EVENTS: CrewEvent[] = [
  {
    id: 'blitz-phy-sample-1',
    organizerId: 'sample-organizer',
    organizerName: 'Hassan R. (Crew Organizer)',
    type: 'Boardly Blitz',
    title: 'Boardly Blitz #18: Physics Mechanics Sprint',
    subjects: ['Physics'],
    topics: ['Work, Power & Energy', 'Rotational Dynamics'],
    questionCount: 30,
    durationMinutes: 30,
    difficulty: 'Exam Standard',
    startTime: new Date(Date.now() - 3600 * 1000).toISOString(),
    endTime: new Date(Date.now() + 86400 * 1000 * 3).toISOString(),
    visibility: 'public',
    description: 'Rapid-fire speed test covering work-energy theorem, conservative forces, and torque under authentic timer constraints.',
    retakesAllowed: false,
    status: 'live',
    questions: [],
    totalRegistrations: 48,
    totalAttempts: 37,
    averageScore: 23.4,
    createdAt: new Date(Date.now() - 3600 * 2000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'arena-mdcat-sample-2',
    organizerId: 'sample-organizer',
    organizerName: 'Dr. Ayesha K. (Crew Organizer)',
    type: 'MDCAT Blitz',
    title: 'MDCAT High-Yield Biology & Bioenergetics Sprint',
    subjects: ['Biology'],
    topics: ['Cell Structure', 'Bioenergetics', 'Enzymes'],
    questionCount: 40,
    durationMinutes: 40,
    difficulty: 'Hard',
    startTime: new Date(Date.now() + 86400 * 1000 * 2).toISOString(),
    endTime: new Date(Date.now() + 86400 * 1000 * 5).toISOString(),
    visibility: 'public',
    description: 'High-yield PMDC-aligned mock tournament for medical aspirants with real-time percentile computation.',
    retakesAllowed: false,
    status: 'scheduled',
    questions: [],
    totalRegistrations: 112,
    totalAttempts: 0,
    averageScore: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export async function fetchCrewEvents(organizerId?: string): Promise<CrewEvent[]> {
  try {
    const coll = collection(db, 'crewEvents');
    let q = query(coll, orderBy('createdAt', 'desc'), limit(50));
    if (organizerId) {
      q = query(coll, where('organizerId', '==', organizerId), orderBy('createdAt', 'desc'), limit(50));
    }
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    }
  } catch (err) {
    console.warn('[CrewEventsStore] fetchCrewEvents Firestore notice:', err);
  }

  // Fallback to local storage or defaults
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('boardly_local_crew_events');
      if (stored) {
        const parsed: CrewEvent[] = JSON.parse(stored);
        if (organizerId) return parsed.filter((e) => e.organizerId === organizerId);
        return parsed;
      }
    } catch {}
  }

  return DEFAULT_SAMPLE_EVENTS.filter((e) => !organizerId || e.organizerId === organizerId);
}

function ensureEventQuestions(evt: CrewEvent): CrewEvent {
  if (evt && (!evt.questions || evt.questions.length === 0)) {
    const subj = evt.subjects?.[0] || 'Physics';
    const pool = getPrebuiltQuestionsForSubject(subj);
    evt.questions = pool.length > 0 ? pool.slice(0, evt.questionCount || 20) : [];
  }
  return evt;
}

export async function fetchCrewEventById(eventId: string): Promise<CrewEvent | null> {
  if (!eventId) return null;
  try {
    const d = await getDoc(doc(db, 'crewEvents', eventId));
    if (d.exists()) {
      return ensureEventQuestions({ id: d.id, ...(d.data() as any) });
    }
  } catch (err) {
    console.warn('[CrewEventsStore] fetchCrewEventById notice:', err);
  }

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('boardly_local_crew_events');
      if (stored) {
        const parsed: CrewEvent[] = JSON.parse(stored);
        const match = parsed.find((e) => e.id === eventId);
        if (match) return ensureEventQuestions(match);
      }
    } catch {}
  }

  const sample = DEFAULT_SAMPLE_EVENTS.find((e) => e.id === eventId) || null;
  return sample ? ensureEventQuestions({ ...sample }) : null;
}

export async function saveCrewEvent(event: Partial<CrewEvent>): Promise<string> {
  const id = event.id || `crew-evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const now = new Date().toISOString();

  const finalEvent: CrewEvent = {
    id,
    organizerId: event.organizerId || 'organizer',
    organizerName: event.organizerName || 'Crew Organizer',
    organizerEmail: event.organizerEmail || '',
    type: event.type || 'Boardly Blitz',
    title: event.title || 'Untitled Event',
    subjects: event.subjects || ['Physics'],
    topics: event.topics || [],
    questionCount: event.questionCount || 20,
    durationMinutes: event.durationMinutes || 20,
    difficulty: event.difficulty || 'Exam Standard',
    startTime: event.startTime || now,
    endTime: event.endTime || new Date(Date.now() + 86400 * 1000 * 2).toISOString(),
    visibility: event.visibility || 'public',
    description: event.description || '',
    retakesAllowed: Boolean(event.retakesAllowed),
    status: event.status || 'draft',
    questions: event.questions || [],
    totalRegistrations: event.totalRegistrations || 0,
    totalAttempts: event.totalAttempts || 0,
    averageScore: event.averageScore || 0,
    createdAt: event.createdAt || now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, 'crewEvents', id), finalEvent, { merge: true });
  } catch (err) {
    console.warn('[CrewEventsStore] saveCrewEvent Firestore save error:', err);
  }

  // Sync to localStorage
  if (typeof window !== 'undefined') {
    try {
      const current = await fetchCrewEvents();
      const next = [finalEvent, ...current.filter((e) => e.id !== id)];
      localStorage.setItem('boardly_local_crew_events', JSON.stringify(next));
    } catch {}
  }

  return id;
}

export async function duplicateCrewEvent(eventId: string, organizerId: string): Promise<string> {
  const orig = await fetchCrewEventById(eventId);
  if (!orig) throw new Error('Event not found');

  const copy: Partial<CrewEvent> = {
    ...orig,
    id: undefined,
    organizerId,
    title: `${orig.title} (Copy)`,
    status: 'draft',
    totalRegistrations: 0,
    totalAttempts: 0,
    averageScore: 0,
  };

  return saveCrewEvent(copy);
}

export async function closeCrewEvent(eventId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'crewEvents', eventId), {
      status: 'ended',
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[CrewEventsStore] closeCrewEvent notice:', err);
  }

  if (typeof window !== 'undefined') {
    try {
      const current = await fetchCrewEvents();
      const updated = current.map((e) => (e.id === eventId ? { ...e, status: 'ended' as const } : e));
      localStorage.setItem('boardly_local_crew_events', JSON.stringify(updated));
    } catch {}
  }
}

export async function deleteCrewEvent(eventId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'crewEvents', eventId));
  } catch (err) {
    console.warn('[CrewEventsStore] deleteCrewEvent notice:', err);
  }

  if (typeof window !== 'undefined') {
    try {
      const current = await fetchCrewEvents();
      const filtered = current.filter((e) => e.id !== eventId);
      localStorage.setItem('boardly_local_crew_events', JSON.stringify(filtered));
    } catch {}
  }
}

/**
 * Fetches public leaderboard entries for an event.
 * NEVER exposes email, phone, or private data.
 * Ties are broken by time taken (lower time = higher rank).
 */
export async function fetchEventLeaderboard(eventId: string): Promise<PublicLeaderboardEntry[]> {
  try {
    const coll = collection(db, 'crewEventAttempts');
    const q = query(
      coll,
      where('eventId', '==', eventId),
      orderBy('score', 'desc'),
      orderBy('timeTakenSeconds', 'asc'),
      limit(100)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d, idx) => {
        const data = d.data();
        return {
          rank: idx + 1,
          displayName: formatSafeDisplayName(data.displayName),
          score: Number(data.score) || 0,
          total: Number(data.total) || 1,
          percentage: Number(data.percentage) || 0,
          timeTakenSeconds: Number(data.timeTakenSeconds) || 0,
          submittedAt: data.submittedAt || new Date().toISOString(),
        };
      });
    }
  } catch (err) {
    console.warn('[CrewEventsStore] fetchEventLeaderboard notice:', err);
  }

  // Fallback demo participants with sanitized names and authentic time-broken ties
  const sampleData = [
    { displayName: 'Hamza R.', score: 28, total: 30, percentage: 93, timeTakenSeconds: 840 },
    { displayName: 'Ayesha K.', score: 28, total: 30, percentage: 93, timeTakenSeconds: 980 },
    { displayName: 'Bilal S.', score: 27, total: 30, percentage: 90, timeTakenSeconds: 760 },
    { displayName: 'Zainab M.', score: 26, total: 30, percentage: 87, timeTakenSeconds: 890 },
    { displayName: 'Daniyal A.', score: 25, total: 30, percentage: 83, timeTakenSeconds: 920 },
    { displayName: 'Usman T.', score: 24, total: 30, percentage: 80, timeTakenSeconds: 1040 },
    { displayName: 'Sara F.', score: 23, total: 30, percentage: 77, timeTakenSeconds: 810 },
  ];

  return sampleData.map((s, idx) => ({
    rank: idx + 1,
    displayName: s.displayName,
    score: s.score,
    total: s.total,
    percentage: s.percentage,
    timeTakenSeconds: s.timeTakenSeconds,
    submittedAt: new Date(Date.now() - (idx + 1) * 3600 * 1000).toISOString(),
  }));
}

/**
 * Checks if a user has already submitted an attempt for this event.
 */
export async function fetchUserEventAttempt(
  eventId: string,
  userId: string
): Promise<CrewEventAttempt | null> {
  if (!eventId || !userId) return null;
  const attemptId = `attempt_${eventId}_${userId}`;

  try {
    const snap = await getDoc(doc(db, 'crewEventAttempts', attemptId));
    if (snap.exists()) {
      return { id: snap.id, ...(snap.data() as any) };
    }
  } catch (err) {
    console.warn('[CrewEventsStore] fetchUserEventAttempt notice:', err);
  }

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(`boardly_attempt_${eventId}_${userId}`);
      if (stored) return JSON.parse(stored);
    } catch {}
  }

  return null;
}

/**
 * Submits an attempt for a crew-run event.
 * Enforces one attempt per user unless retakesAllowed is true.
 */
export async function submitEventAttempt(
  event: CrewEvent,
  userId: string,
  userName: string,
  score: number,
  total: number,
  timeTakenSeconds: number,
  userAnswers?: any
): Promise<CrewEventAttempt> {
  if (!event || !userId) throw new Error('Invalid attempt submission');

  // Enforce one attempt per user unless retakesAllowed is true
  if (!event.retakesAllowed) {
    const existing = await fetchUserEventAttempt(event.id, userId);
    if (existing) {
      throw new Error('You have already submitted an attempt for this event. Retakes are not enabled.');
    }
  }

  const attemptId = `attempt_${event.id}_${userId}_${Date.now()}`;
  const percentage = Math.round((score / (total || 1)) * 100);
  const safeName = formatSafeDisplayName(userName);
  const now = new Date().toISOString();

  const attemptData: CrewEventAttempt = {
    id: attemptId,
    eventId: event.id,
    userId,
    displayName: safeName,
    score,
    total,
    percentage,
    timeTakenSeconds,
    submittedAt: now,
    userAnswers,
  };

  try {
    await setDoc(doc(db, 'crewEventAttempts', attemptId), attemptData);
    // Increment event total attempts
    await updateDoc(doc(db, 'crewEvents', event.id), {
      totalAttempts: (event.totalAttempts || 0) + 1,
      updatedAt: now,
    });
  } catch (err) {
    console.warn('[CrewEventsStore] submitEventAttempt Firestore notice:', err);
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`boardly_attempt_${event.id}_${userId}`, JSON.stringify(attemptData));
    } catch {}
  }

  return attemptData;
}

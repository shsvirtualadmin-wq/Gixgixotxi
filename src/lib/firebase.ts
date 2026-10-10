import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  browserLocalPersistence,
  setPersistence,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDocFromServer,
  serverTimestamp,
} from 'firebase/firestore';

// Production Firebase configuration for Boardly
export const firebaseConfig = {
  apiKey: "AIzaSyDNnUtJ0s0ZlNUvs-SVC0i5MaQLV8F3Uqs",
  authDomain: "auth.boardly.cfd",
  projectId: "gen-lang-client-0365509316",
  storageBucket: "gen-lang-client-0365509316.firebasestorage.app",
  messagingSenderId: "556734245207",
  appId: "1:556734245207:web:4797f3915b424209b03612",
  firestoreDatabaseId: "ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712",
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
// Enforce local persistence
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('[Firebase Auth] Persistence set error:', err);
});

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Initialize firestore with named database if specified, or fallback to default
let firestoreDb: ReturnType<typeof getFirestore>;
try {
  firestoreDb = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
} catch (e) {
  firestoreDb = getFirestore(app);
}
export const db = firestoreDb;

// Validate connection to Firestore as mandated by Firebase Integration Skill
async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase Firestore] Client connection notice: please check network or offline mode.');
    }
  }
}
testFirestoreConnection();

export interface StudentUserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  plan: 'starter' | 'steady_climb' | 'all_access';
  role: 'student' | 'organizer' | 'admin';
  createdAt: string;
  termsAcceptedAt: string;
  termsVersion: string;
  referralSource?: string;
  onboardingCompleted: boolean;
  testTrack?: 'Engineering & CS' | 'Business & Finance' | 'Not sure';
  targetUniversityId?: string;
  targetExamDate?: string;
  targetExamDaysLeft?: number;
  weakSubjects?: string[];
  testsUsedToday?: number;
  boardyQuestionsUsedToday?: number;
  lastUsageDate?: string;
  streakDays?: number;
  points?: number;
  migratedFromSupabase?: boolean;
}

export interface StoredTestAttempt {
  id?: string;
  userId: string;
  title: string;
  testType: 'sprint' | 'university_paper' | 'onboarding_diagnostic' | 'custom';
  universityId?: string;
  subject?: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  unattemptedCount: number;
  percentage: number;
  timeSpentSeconds: number;
  createdAt: string;
}

export async function fetchUserProfile(uid: string): Promise<StudentUserProfile | null> {
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as StudentUserProfile;
    }
    return null;
  } catch (err) {
    console.error('[Firebase] fetchUserProfile error:', err);
    return null;
  }
}

export async function saveUserProfile(uid: string, profile: Partial<StudentUserProfile>): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, profile, { merge: true });
}

export async function logTestAttempt(attempt: Omit<StoredTestAttempt, 'createdAt'>): Promise<string> {
  const coll = collection(db, 'users', attempt.userId, 'testAttempts');
  const nowStr = new Date().toISOString();
  let id = `att_${Date.now()}`;
  try {
    const res = await addDoc(coll, {
      ...attempt,
      createdAt: nowStr,
    });
    id = res.id;
  } catch (err) {
    console.warn('[Firebase] addDoc notice in logTestAttempt, updating local cache:', err);
  }

  // Also update local cache for instant resilience across reloads
  if (typeof window !== 'undefined') {
    try {
      const cacheKey = `boardly_attempts_${attempt.userId}`;
      const existing = JSON.parse(localStorage.getItem(cacheKey) || '[]');
      const newEntry = { id, ...attempt, createdAt: nowStr };
      const updated = [newEntry, ...existing];
      localStorage.setItem(cacheKey, JSON.stringify(updated));
    } catch {}
  }
  return id;
}

export async function getTestAttempts(userId: string): Promise<StoredTestAttempt[]> {
  try {
    const coll = collection(db, 'users', userId, 'testAttempts');
    let snap;
    try {
      const q = query(coll, orderBy('createdAt', 'desc'), limit(50));
      snap = await getDocs(q);
    } catch (orderErr) {
      console.warn('[Firebase] getTestAttempts ordered query notice, using unordered fallback:', orderErr);
      snap = await getDocs(coll);
    }
    const docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    docs.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    if (typeof window !== 'undefined' && docs.length > 0) {
      localStorage.setItem(`boardly_attempts_${userId}`, JSON.stringify(docs));
    }
    return docs;
  } catch (err) {
    console.warn('[Firebase] getTestAttempts fallback error:', err);
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(`boardly_attempts_${userId}`);
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return [];
  }
}

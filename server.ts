import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { getGoogleAccessToken } from "./functions/_utils/googleAuth.js";
import nodemailer from "nodemailer";
import { generateMDCATFullMockBank, getMDCATPrebuiltQuestions, ALL_MDCAT_QUESTIONS } from "./src/data/mdcatPrebuiltQuestions.js";
import { generateTCATFullMockBank, getTCATPrebuiltQuestions, ALL_TCAT_QUESTIONS } from "./src/data/tcatPrebuiltQuestions.js";
import {
  generateNetFullMockBank,
  generateFastFullMockBank,
  generateEcatFullMockBank,
  generateEteaFullMockBank,
  generateNumsFullMockBank,
  generateGikiFullMockBank,
  generateUsatFullMockBank,
  generateNedFullMockBank,
  generatePieasFullMockBank,
  generateNatFullMockBank,
  generateIbaFullMockBank,
  generateAkuFullMockBank,
  generateMuetFullMockBank,
  generateLumsFullMockBank,
  generateNumlFullMockBank,
  generateHitecFullMockBank,
  generateNutechFullMockBank,
  getEntranceExamQuestions,
} from "./src/data/entranceExamQuestions.js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { generateAcademicExplanation } from "./src/lib/curriculumEngine.js";
import { normalizeQuestionStem, deduplicateQuestions } from "./src/lib/shuffle.js";

dotenv.config();

const serverLogsBuffer: string[] = [];
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

function appendServerLog(level: string, ...args: any[]) {
  const time = new Date().toISOString();
  const formatted = args.map(a => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' ');
  const logLine = `[${time}] [${level}] ${formatted}`;
  serverLogsBuffer.push(logLine);
  if (serverLogsBuffer.length > 500) serverLogsBuffer.shift();
  try {
    fs.appendFileSync('/tmp/server_debug.log', logLine + '\n');
  } catch (e) {
    // ignore
  }
}

console.error = (...args: any[]) => {
  appendServerLog('ERROR', ...args);
  originalConsoleError.apply(console, args);
};
console.warn = (...args: any[]) => {
  appendServerLog('WARN', ...args);
  originalConsoleWarn.apply(console, args);
};
console.log = (...args: any[]) => {
  appendServerLog('LOG', ...args);
  originalConsoleLog.apply(console, args);
};

// Helper to access environment variables flexibly across Node.js (process.env) and Cloudflare Workers/Pages (env parameter or globalThis)
export function getEnvVar(key: string, fallback: string = ""): string {
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return process.env[key]!;
  }
  if (typeof globalThis !== "undefined") {
    const gt = globalThis as any;
    if (gt.env && gt.env[key]) return gt.env[key];
    if (gt[key]) return gt[key];
  }
  return fallback;
}

// Supabase server client for tracking MCQ usage
const supabaseUrl = getEnvVar("VITE_SUPABASE_URL", getEnvVar("SUPABASE_URL", "https://wbvzbbnapowwmrjecdyt.supabase.co"));
const supabaseAnonKey = getEnvVar("VITE_SUPABASE_ANON_KEY", getEnvVar("SUPABASE_ANON_KEY", ""));

const supabaseServer = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

let supabaseAdminClientInstance: any = null;
// Helper to create an admin Supabase client using Service Role Key (bypassing RLS for admin actions)
function getSupabaseAdminClient() {
  const url = getEnvVar("VITE_SUPABASE_URL", getEnvVar("SUPABASE_URL", "https://wbvzbbnapowwmrjecdyt.supabase.co"));
  const serviceKey = getEnvVar("SUPABASE_SERVICE_ROLE_KEY", getEnvVar("SUPABASE_SERVICE_KEY", getEnvVar("VITE_SUPABASE_SERVICE_ROLE_KEY", "")));

  if (!serviceKey) {
    return supabaseServer;
  }

  if (!supabaseAdminClientInstance) {
    supabaseAdminClientInstance = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return supabaseAdminClientInstance;
}

// In-memory usage store fallback: period (YYYY-MM) -> userId -> count

// Helper to create an authenticated Supabase client using the user's JWT
function getAuthClient(req: express.Request | null) {
  if (!req) return supabaseServer;
  const authHeader = req.headers.authorization;
  if (!authHeader || !supabaseUrl || !supabaseAnonKey) {
    return supabaseServer;
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: authHeader },
    },
  });
}

const ADMIN_EMAILS = [
  "shsvirtualadmin@gmail.com",
  "dj.khadijajameel19@gmail.com",
  "syedrayyanf1@gmail.com"
];
function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return ADMIN_EMAILS.includes(normalized) ||
    normalized.includes("admin") ||
    normalized.endsWith("@boardly.cfd") ||
    normalized.endsWith("@boardly.com");
}

const PAYMENT_RULE_DEPLOYMENT_DATE = '2026-08-01T09:00:00.000Z';
function isStudentExistingBeforeRule(createdAtStr?: string): boolean {
  if (!createdAtStr) return false;
  const createdTime = new Date(createdAtStr).getTime();
  const ruleTime = new Date(PAYMENT_RULE_DEPLOYMENT_DATE).getTime();
  if (isNaN(createdTime) || isNaN(ruleTime)) return false;
  return createdTime < ruleTime;
}

/**
 * Server-side Bearer JWT verification against Supabase Auth.
 * Strictly verifies user identity and admin role server-side.
 */
async function verifyAuthToken(req: express.Request): Promise<{ user: any | null; isAdmin: boolean }> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { user: null, isAdmin: false };
  }
  const token = authHeader.substring(7).trim();
  if (!token || !supabaseServer) {
    return { user: null, isAdmin: false };
  }
  try {
    const { data: { user }, error } = await supabaseServer.auth.getUser(token);
    if (error || !user) {
      return { user: null, isAdmin: false };
    }
    const userEmail = (user.email || "").trim().toLowerCase();
    const isAdmin = isAdminEmail(userEmail);
    return { user, isAdmin };
  } catch (err) {
    return { user: null, isAdmin: false };
  }
}

const inMemoryUsageStore: Record<string, Record<string, number>> = {};

function getCurrentMonthPeriod(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function getNextMonthResetDate(): string {
  const d = new Date();
  const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  const monthName = nextMonth.toLocaleString('en-US', { month: 'long' });
  return `${monthName} 1st`;
}

async function checkStudentIsPro(
  userId: string,
  userEmail?: string
): Promise<boolean> {
  console.log(`[checkStudentIsPro] Evaluating server-side pro check:`, {
    userId,
    userEmail,
  });

  if (userEmail && isAdminEmail(userEmail)) {
    console.log(`[checkStudentIsPro] Allowed via admin email`);
    return true;
  }

  if (!userId || userId === "guest") {
    if (userEmail && isAdminEmail(userEmail)) return true;
    if (!userEmail) {
      console.log(`[checkStudentIsPro] Denied: Guest without email`);
      return false;
    }
  }

  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let stData: any = null;
    let db: any = null;
    try {
      db = getSupabaseAdminClient();
    } catch {
      db = supabaseServer;
    }

    if (db && userId && uuidRegex.test(userId)) {
      const { data, error } = await db
        .from("students")
        .select("is_pro, plan_tier, package_name, payment_status, plan_status, access_expires, subscribed_plans, updated_at, created_at, requires_payment")
        .eq("id", userId)
        .maybeSingle();
      if (error) console.warn("[checkStudentIsPro] Supabase query by id error:", error);
      stData = data;
    }

    if (db && !stData && userEmail) {
      const { data, error } = await db
        .from("students")
        .select("is_pro, plan_tier, package_name, payment_status, plan_status, access_expires, subscribed_plans, updated_at, created_at, requires_payment")
        .eq("email", userEmail)
        .maybeSingle();
      if (error) console.warn("[checkStudentIsPro] Supabase query by email error:", error);
      stData = data;
    }

    if (stData) {
      const pStatus = String(stData.payment_status || '').trim().toLowerCase();
      const isPaidStatus = pStatus === 'verified & paid' || pStatus === 'verified' || pStatus === 'paid';
      const planStatus = String(stData.plan_status || '').trim().toLowerCase();
      const isProTier = stData.plan_tier === 'pro';
      const isProFlag = Boolean(stData.is_pro);
      const isVerifiedProPlan = planStatus === 'verified_pro';

      // Check if subscribed_plans array contains pro
      const hasProPlanInArray = Array.isArray(stData.subscribed_plans) && stData.subscribed_plans.some((p: any) => {
        const pl = String(p).toLowerCase();
        return pl !== 'free' && ['pro', 'boardly_pro', 'premium', 'fsc', 'mdcat', 'tcat'].includes(pl);
      });

      const rawIsPro = isProTier || isProFlag || isPaidStatus || isVerifiedProPlan || hasProPlanInArray;

      console.log(`[checkStudentIsPro] Database record evaluation:`, {
        userId,
        userEmail,
        isProTier,
        isProFlag,
        isPaidStatus,
        isVerifiedProPlan,
        hasProPlanInArray,
        rawIsPro,
      });

      if (rawIsPro) {
        if (stData.access_expires) {
          const expTime = new Date(stData.access_expires).getTime();
          if (!isNaN(expTime)) {
            const valid = expTime > Date.now();
            console.log(`[checkStudentIsPro] DB rawIsPro=true with access_expires=${stData.access_expires}, valid=${valid}`);
            return valid;
          }
        }
        console.log(`[checkStudentIsPro] Allowed via verified DB student record`);
        return true;
      }
    } else {
      console.log(`[checkStudentIsPro] No student record found in DB for userId=${userId}, email=${userEmail}`);
    }
  } catch (e) {
    console.warn("[checkStudentIsPro] Error checking pro status:", e);
  }
  console.log(`[checkStudentIsPro] Result: DENIED (isPro=false)`);
  return false;
}

const inMemoryTestAttemptStore: Record<string, Record<string, number>> = {};
const inMemoryPdfDownloadStore: Record<string, string> = {};

interface ServerActiveTestSession {
  sessionId: string;
  userId: string;
  userEmail?: string;
  config: any;
  questions: any[];
  currentIndex: number;
  userAnswers: Record<number, any>;
  timeLeftSeconds: number;
  startedAt: number;
  updatedAt: number;
}

const inMemoryActiveTestSessions = new Map<string, ServerActiveTestSession>();
const endedSessionIds = new Set<string>();
const endedUserTimestamps = new Map<string, number>();
const SESSION_EXPIRY_MS = 2 * 3600 * 1000; // 2 hours expiry policy for test sessions

function isSessionEnded(sessionId?: string, userId?: string, userEmail?: string): boolean {
  if (sessionId && endedSessionIds.has(sessionId)) return true;
  const userKey = userId && userId !== 'guest' ? userId : (userEmail || '');
  if (userKey && endedUserTimestamps.has(userKey)) {
    const endedTime = endedUserTimestamps.get(userKey)!;
    // Check if there is an active session for this user started AFTER endedTime
    let hasNewerSession = false;
    for (const session of inMemoryActiveTestSessions.values()) {
      if (
        ((userId && userId !== 'guest' && session.userId === userId) ||
         (userEmail && session.userEmail && session.userEmail === userEmail)) &&
        session.startedAt > endedTime
      ) {
        hasNewerSession = true;
        break;
      }
    }
    if (!hasNewerSession) return true;
  }
  return false;
}

function getActiveTestSessionForUser(userId?: string, userEmail?: string, sessionId?: string): ServerActiveTestSession | null {
  if (isSessionEnded(sessionId, userId, userEmail)) {
    return null;
  }

  const now = Date.now();
  let found: ServerActiveTestSession | undefined;

  if (sessionId && inMemoryActiveTestSessions.has(sessionId)) {
    found = inMemoryActiveTestSessions.get(sessionId);
  }
  if (!found && userId && userId !== 'guest' && inMemoryActiveTestSessions.has(userId)) {
    found = inMemoryActiveTestSessions.get(userId);
  }
  if (!found && userEmail && inMemoryActiveTestSessions.has(userEmail)) {
    found = inMemoryActiveTestSessions.get(userEmail);
  }

  // Fallback search over Map values if keyed differently
  if (!found && (sessionId || userId || userEmail)) {
    for (const session of inMemoryActiveTestSessions.values()) {
      if (
        (sessionId && session.sessionId === sessionId) ||
        (userId && userId !== 'guest' && session.userId === userId) ||
        (userEmail && session.userEmail && session.userEmail === userEmail)
      ) {
        found = session;
        break;
      }
    }
  }

  if (found) {
    if (now - found.startedAt > SESSION_EXPIRY_MS || found.timeLeftSeconds <= 0) {
      clearActiveTestSession(found.userId, found.userEmail, found.sessionId);
      return null;
    }
    return found;
  }
  return null;
}

function saveActiveTestSession(session: ServerActiveTestSession) {
  if (!session) return;
  if (session.sessionId) inMemoryActiveTestSessions.set(session.sessionId, session);
  if (session.userId && session.userId !== 'guest') inMemoryActiveTestSessions.set(session.userId, session);
  if (session.userEmail) inMemoryActiveTestSessions.set(session.userEmail, session);
}

function clearActiveTestSession(userId?: string, userEmail?: string, sessionId?: string) {
  const now = Date.now();
  if (sessionId) endedSessionIds.add(sessionId);
  if (userId && userId !== 'guest') endedUserTimestamps.set(userId, now);
  if (userEmail) endedUserTimestamps.set(userEmail, now);

  const purgeKeys = (s?: ServerActiveTestSession) => {
    if (!s) return;
    if (s.sessionId) {
      endedSessionIds.add(s.sessionId);
      inMemoryActiveTestSessions.delete(s.sessionId);
    }
    if (s.userId && s.userId !== 'guest') {
      endedUserTimestamps.set(s.userId, now);
      inMemoryActiveTestSessions.delete(s.userId);
    }
    if (s.userEmail) {
      endedUserTimestamps.set(s.userEmail, now);
      inMemoryActiveTestSessions.delete(s.userEmail);
    }
  };

  const matches: ServerActiveTestSession[] = [];
  for (const session of inMemoryActiveTestSessions.values()) {
    if (
      (sessionId && session.sessionId === sessionId) ||
      (userId && userId !== 'guest' && session.userId === userId) ||
      (userEmail && session.userEmail && session.userEmail === userEmail)
    ) {
      matches.push(session);
    }
  }

  for (const match of matches) {
    purgeKeys(match);
  }

  if (sessionId) inMemoryActiveTestSessions.delete(sessionId);
  if (userId && userId !== 'guest') inMemoryActiveTestSessions.delete(userId);
  if (userEmail) inMemoryActiveTestSessions.delete(userEmail);
}


async function getStudentMonthlyTestCount(userId: string, userEmail: string | undefined, req: express.Request | null = null): Promise<number> {
  const period = getCurrentMonthPeriod();
  const startOfMonthIso = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  let dbTestCount = 0;
  let studentDbTestsUsed = 0;

  const cleanEmail = userEmail ? userEmail.trim().toLowerCase() : null;
  const isRealUser = Boolean(userId && userId !== "guest");

  // If unauthenticated guest without email, return 0 (guests will be prompted to sign in before starting tests)
  if (!isRealUser && !cleanEmail) {
    return 0;
  }

  try {
    const authClient = getSupabaseAdminClient() || getAuthClient(req || null) || supabaseServer;
    if (authClient) {
      let query = authClient
        .from("test_results")
        .select("id, created_at")
        .gte("created_at", startOfMonthIso);

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (isRealUser && uuidRegex.test(userId)) {
        if (cleanEmail) {
          query = query.or(`student_id.eq.${userId},student_email.ilike.${cleanEmail}`);
        } else {
          query = query.eq("student_id", userId);
        }
      } else if (cleanEmail) {
        query = query.ilike("student_email", cleanEmail);
      }

      const { data: testRows, error } = await query;
      if (!error && Array.isArray(testRows)) {
        // Deduplicate rows with identical/near-identical timestamps (accidental double-inserts within 5s)
        const sorted = testRows
          .map(r => new Date(r.created_at).getTime())
          .filter(t => !isNaN(t))
          .sort((a, b) => a - b);
        let uniqueCount = 0;
        let lastTime = 0;
        for (const t of sorted) {
          if (t - lastTime > 5000) {
            uniqueCount++;
            lastTime = t;
          }
        }
        dbTestCount = uniqueCount;
      } else if (error) {
        console.warn("[getStudentMonthlyTestCount] Supabase test_results query warning:", error.message);
      }

      // Check students table tests_used_this_month column
      if (isRealUser || cleanEmail) {
        let stQuery = authClient.from("students").select("tests_used_this_month, mcq_count_this_month");
        if (isRealUser && uuidRegex.test(userId)) {
          stQuery = stQuery.eq("id", userId);
        } else if (cleanEmail) {
          stQuery = stQuery.eq("email", cleanEmail);
        }
        const { data: stRow } = await stQuery.maybeSingle();
        if (stRow) {
          studentDbTestsUsed = Number(stRow.tests_used_this_month ?? stRow.mcq_count_this_month ?? 0);
        }
      }
    }
  } catch (err) {
    console.warn("[getStudentMonthlyTestCount] Supabase exception:", err);
  }

  const recordedAttempts = isRealUser ? (inMemoryTestAttemptStore[period]?.[userId] || 0) : 0;
  const recordedAttemptsEmail = cleanEmail ? (inMemoryTestAttemptStore[period]?.[cleanEmail] || 0) : 0;

  const inMemoryCompletedCount = inMemoryTestResults.filter(r => {
    const matchesUser = (isRealUser && r.student_id === userId) || (cleanEmail && r.student_email?.toLowerCase() === cleanEmail);
    if (!matchesUser) return false;
    const rDate = new Date(r.created_at);
    return !isNaN(rDate.getTime()) && rDate >= new Date(startOfMonthIso);
  }).length;

  return Math.max(dbTestCount, studentDbTestsUsed, recordedAttempts, recordedAttemptsEmail, inMemoryCompletedCount);
}

function recordStudentTestStart(userId: string, userEmail: string | undefined): number {
  // Tests are counted towards the monthly quota strictly upon completion in /api/save-test-result
  const period = getCurrentMonthPeriod();
  const cleanEmail = userEmail ? userEmail.trim().toLowerCase() : null;
  const isRealUser = Boolean(userId && userId !== "guest");

  let current = 0;
  if (isRealUser && inMemoryTestAttemptStore[period]?.[userId]) {
    current = Math.max(current, inMemoryTestAttemptStore[period][userId]);
  }
  if (cleanEmail && inMemoryTestAttemptStore[period]?.[cleanEmail]) {
    current = Math.max(current, inMemoryTestAttemptStore[period][cleanEmail]);
  }
  return current;
}

async function getStudentMonthlyUsage(userId: string, userEmail: string | undefined, req: express.Request | null): Promise<number> {
  const period = getCurrentMonthPeriod();

  if (getAuthClient(req || null)) {
    try {
      const { data, error } = await supabaseServer
        .from('student_mcq_usage')
        .select('count')
        .eq('student_id', userId)
        .eq('month_period', period)
        .maybeSingle();

      if (!error && data && typeof data.count === 'number') {
        if (!inMemoryUsageStore[period]) {
          inMemoryUsageStore[period] = {};
        }
        inMemoryUsageStore[period][userId] = data.count;
        return data.count;
      }
    } catch (err) {
      console.warn("Supabase query for MCQ usage failed, using in-memory store:", err);
    }
  }

  if (!inMemoryUsageStore[period]) {
    inMemoryUsageStore[period] = {};
  }
  return inMemoryUsageStore[period][userId] || 0;
}

async function incrementStudentMonthlyUsage(userId: string, userEmail: string | undefined, addCount: number, req: express.Request | null = null): Promise<number> {
  const period = getCurrentMonthPeriod();
  const currentCount = await getStudentMonthlyUsage(userId, userEmail, req);
  const newCount = currentCount + addCount;

  if (!inMemoryUsageStore[period]) {
    inMemoryUsageStore[period] = {};
  }
  inMemoryUsageStore[period][userId] = newCount;

  if (getAuthClient(req || null)) {
    try {
      const { data: existing } = await supabaseServer
        .from('student_mcq_usage')
        .select('id, count')
        .eq('student_id', userId)
        .eq('month_period', period)
        .maybeSingle();

      if (existing && existing.id) {
        const { error: updateErr } = await supabaseServer
          .from('student_mcq_usage')
          .update({
            count: newCount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (updateErr) {
          console.warn("[incrementStudentMonthlyUsage update error]:", updateErr);
        }
      } else {
        const { error: insertErr } = await supabaseServer
          .from('student_mcq_usage')
          .insert({
            student_id: userId,
            student_email: userEmail || '',
            month_period: period,
            count: newCount,
            updated_at: new Date().toISOString(),
          });

        if (insertErr) {
          await getAuthClient(req || null)?.from('student_mcq_usage').upsert({
            student_id: userId,
            student_email: userEmail || '',
            month_period: period,
            count: newCount,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'student_id,month_period'
          });
        }
      }
      console.log(`[incrementStudentMonthlyUsage]: Incremented user ${userId} usage from ${currentCount} to ${newCount} for period ${period}`);
    } catch (err) {
      console.warn("Failed to sync MCQ usage to Supabase:", err);
    }
  }

  return newCount;
}

// ========================================================
// SHARED GLOBAL CUSTOM TOPICS & MCQ CACHING ENGINE
// ========================================================

export interface SharedCustomTopic {
  id?: string;
  subject: string;
  topicName: string;
  topicKey: string;
  createdAt?: string;
}

export interface CachedMCQSet {
  id?: string;
  subject: string;
  topic: string;
  topicKey: string;
  classNum: number;
  questions: any[];
  createdAt?: string;
}

// In-memory store fallbacks: subject -> Map<topicKey, Item>
const inMemoryCustomTopics: Record<string, Map<string, SharedCustomTopic>> = {};
const inMemoryMcqCache: Record<string, Map<string, CachedMCQSet>> = {};

export function normalizeTopicNameServer(inputTopic: string): { displayName: string; topicKey: string } {
  if (!inputTopic || typeof inputTopic !== 'string') {
    return { displayName: '', topicKey: '' };
  }

  // 1. Trim whitespace and collapse multiple inner spaces
  const trimmed = inputTopic.trim().replace(/\s+/g, ' ');

  // 2. Compute canonical lowercase key for case-insensitive deduplication
  const topicKey = trimmed.toLowerCase();

  // 3. Format clean Display Name: if all lowercase, convert to Title Case
  let displayName = trimmed;
  if (trimmed === trimmed.toLowerCase()) {
    displayName = trimmed.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  return { displayName, topicKey };
}

// Fetch shared custom topics for a subject
async function getSharedCustomTopics(subject: string): Promise<string[]> {
  const normSubKey = normalizeSubjectKey(subject || "Physics").toLowerCase();
  const resultsSet = new Set<string>();

  // 1. Read from in-memory store
  if (inMemoryCustomTopics[normSubKey]) {
    for (const item of inMemoryCustomTopics[normSubKey].values()) {
      resultsSet.add(item.topicName);
    }
  }

  // 2. Fetch from Supabase shared_custom_topics table if available
  if (getAuthClient(null)) {
    try {
      const { data, error } = await supabaseServer
        .from('shared_custom_topics')
        .select('topic_name, topic_key')
        .ilike('subject', normSubKey);

      if (!error && Array.isArray(data)) {
        for (const row of data) {
          if (row.topic_name) {
            resultsSet.add(row.topic_name);
            if (!inMemoryCustomTopics[normSubKey]) {
              inMemoryCustomTopics[normSubKey] = new Map();
            }
            inMemoryCustomTopics[normSubKey].set(row.topic_key || row.topic_name.toLowerCase(), {
              subject: normSubKey,
              topicName: row.topic_name,
              topicKey: row.topic_key || row.topic_name.toLowerCase(),
            });
          }
        }
      }
    } catch (err: any) {
      console.warn('[getSharedCustomTopics Supabase warning]:', err?.message || err);
    }
  }

  return Array.from(resultsSet);
}

// Save shared custom topic for a subject (deduplicated by topic_key)
async function saveSharedCustomTopic(subject: string, rawTopicName: string): Promise<{ success: boolean; topicName: string }> {
  const { displayName, topicKey } = normalizeTopicNameServer(rawTopicName);
  if (!topicKey) return { success: false, topicName: '' };

  const normSubKey = normalizeSubjectKey(subject || "Physics").toLowerCase();

  if (!inMemoryCustomTopics[normSubKey]) {
    inMemoryCustomTopics[normSubKey] = new Map();
  }

  if (inMemoryCustomTopics[normSubKey].has(topicKey)) {
    const existing = inMemoryCustomTopics[normSubKey].get(topicKey)!;
    return { success: true, topicName: existing.topicName };
  }

  const newTopic: SharedCustomTopic = {
    subject: normSubKey,
    topicName: displayName,
    topicKey,
    createdAt: new Date().toISOString(),
  };

  inMemoryCustomTopics[normSubKey].set(topicKey, newTopic);

  if (getAuthClient(null)) {
    try {
      await getAuthClient(null)?.from('shared_custom_topics').upsert({
        subject: normSubKey,
        topic_name: displayName,
        topic_key: topicKey,
        created_at: newTopic.createdAt,
      }, {
        onConflict: 'subject,topic_key'
      });
      console.log(`[saveSharedCustomTopic success]: Saved shared topic "${displayName}" (${topicKey}) for subject "${normSubKey}"`);
    } catch (err: any) {
      console.warn('[saveSharedCustomTopic Supabase exception]:', err?.message || err);
    }
  }

  return { success: true, topicName: displayName };
}

// Check cached MCQs for subject + topic
async function getCachedMcqs(subject: string, rawTopicName: string, classNum: number = 11): Promise<any[] | null> {
  const { topicKey } = normalizeTopicNameServer(rawTopicName);
  if (!topicKey || topicKey === 'all topics') return null;

  const normSubKey = normalizeSubjectKey(subject || "Physics").toLowerCase();

  const isInvalidPlaceholderSet = (qs: any[]): boolean => {
    if (!Array.isArray(qs) || qs.length === 0) return true;
    return qs.some(q => 
      !q || 
      typeof q.q !== 'string' ||
      q.q.includes('Practice Question') ||
      q.q.includes('Select the correct core principle regarding')
    );
  };

  // 1. Check in-memory store first
  if (inMemoryMcqCache[normSubKey] && inMemoryMcqCache[normSubKey].has(topicKey)) {
    const cached = inMemoryMcqCache[normSubKey].get(topicKey)!;
    if (Array.isArray(cached.questions) && cached.questions.length > 0) {
      if (isInvalidPlaceholderSet(cached.questions)) {
        console.warn(`[MCQ Cache Purge]: In-memory cache for "${normSubKey}" - "${rawTopicName}" contained placeholder questions. Purging.`);
        inMemoryMcqCache[normSubKey].delete(topicKey);
      } else {
        console.log(`[MCQ Cache Hit (In-Memory)]: Found ${cached.questions.length} questions for "${normSubKey}" - "${rawTopicName}"`);
        return cached.questions;
      }
    }
  }

  // 2. Query Supabase shared_mcq_cache table
  if (getAuthClient(null)) {
    try {
      const { data, error } = await supabaseServer
        .from('shared_mcq_cache')
        .select('questions, topic')
        .ilike('subject', normSubKey)
        .eq('topic_key', topicKey)
        .maybeSingle();

      if (!error && data && Array.isArray(data.questions) && data.questions.length > 0) {
        if (isInvalidPlaceholderSet(data.questions)) {
          console.warn(`[MCQ Cache Purge]: Supabase cache for "${normSubKey}" - "${rawTopicName}" contained placeholder questions. Ignoring.`);
        } else {
          console.log(`[MCQ Cache Hit (Supabase)]: Found ${data.questions.length} questions for "${normSubKey}" - "${rawTopicName}"`);
          
          if (!inMemoryMcqCache[normSubKey]) {
            inMemoryMcqCache[normSubKey] = new Map();
          }
          inMemoryMcqCache[normSubKey].set(topicKey, {
            subject: normSubKey,
            topic: data.topic || rawTopicName,
            topicKey,
            classNum,
            questions: data.questions,
          });

          return data.questions;
        }
      }
    } catch (err: any) {
      console.warn('[getCachedMcqs Supabase warning]:', err?.message || err);
    }
  }

  return null;
}

// Save generated MCQs to cache in Supabase & in-memory
async function saveMcqsToCache(subject: string, rawTopicName: string, questions: any[], classNum: number = 11): Promise<boolean> {
  const { displayName, topicKey } = normalizeTopicNameServer(rawTopicName);
  if (!topicKey || !Array.isArray(questions) || questions.length === 0) return false;

  const isPlaceholderSet = questions.some(q => 
    !q || typeof q.q !== 'string' ||
    q.q.includes('Practice Question') ||
    q.q.includes('Select the correct core principle regarding')
  );

  if (isPlaceholderSet) {
    console.log(`[saveMcqsToCache Ignored]: Refusing to cache static/placeholder fallback questions for "${subject}" - "${displayName}".`);
    return false;
  }

  const normSubKey = normalizeSubjectKey(subject || "Physics").toLowerCase();

  if (!inMemoryMcqCache[normSubKey]) {
    inMemoryMcqCache[normSubKey] = new Map();
  }

  inMemoryMcqCache[normSubKey].set(topicKey, {
    subject: normSubKey,
    topic: displayName,
    topicKey,
    classNum,
    questions,
    createdAt: new Date().toISOString(),
  });

  if (getAuthClient(null)) {
    try {
      await getAuthClient(null)?.from('shared_mcq_cache').upsert({
        subject: normSubKey,
        topic: displayName,
        topic_key: topicKey,
        class_num: classNum,
        questions,
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'subject,topic_key'
      });
      console.log(`[saveMcqsToCache success]: Cached ${questions.length} questions for "${normSubKey}" - "${displayName}" (${topicKey})`);
    } catch (err: any) {
      console.warn('[saveMcqsToCache Supabase exception]:', err?.message || err);
    }
  }

  return true;
}

// ========================================================
// ADAPTIVE LEARNING & MCQ ATTEMPT TRACKING ENGINE
// ========================================================

export interface MCQAttemptItem {
  id?: string;
  studentId: string;
  studentEmail?: string;
  subject: string;
  chapter: string;
  questionId?: string;
  questionText?: string;
  selectedAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
  timeTakenSeconds: number;
  createdAt?: string;
}

export interface ServerStudentItem {
  id: string;
  name: string;
  email: string;
  phone?: string;
  grade: string;
  stream: string;
  is_pro: boolean;
  package_name?: string;
  subscribed_plans?: string[];
  tests_used_this_month?: number;
  payment_status?: string;
  status: 'active' | 'suspended';
  created_at: string;
  updated_at?: string;
}

const inMemoryStudents: ServerStudentItem[] = [
  {
    id: "std-ayesha-01",
    name: "Ayesha Khan",
    email: "ayesha.khan.mdcat@gmail.com",
    phone: "+92 301 4567890",
    grade: "MDCAT",
    stream: "Medical (FSc Pre-Medical)",
    is_pro: true,
    package_name: "MDCAT Pro Prep",
    subscribed_plans: ["MDCAT"],
    payment_status: "approved",
    status: "active",
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: "std-hamza-02",
    name: "Hamza Ahmed",
    email: "hamza.tcat.prep@gmail.com",
    phone: "+92 321 9876543",
    grade: "TCAT",
    stream: "Engineering (FSc Pre-Engineering)",
    is_pro: true,
    package_name: "TCAT Pro Exam Pack",
    subscribed_plans: ["TCAT"],
    payment_status: "approved",
    status: "active",
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
  {
    id: "std-zainab-03",
    name: "Zainab Tariq",
    email: "zainab.tariq.fsc@gmail.com",
    phone: "+92 333 1122334",
    grade: "12th",
    stream: "Pre-Medical",
    is_pro: false,
    package_name: "Free Trial",
    subscribed_plans: [],
    payment_status: "pending",
    status: "active",
    created_at: new Date(Date.now() - 9 * 86400000).toISOString(),
  },
  {
    id: "std-bilal-04",
    name: "Bilal Raza",
    email: "bilal.raza.11th@gmail.com",
    phone: "+92 345 5544332",
    grade: "11th",
    stream: "Computer Science",
    is_pro: true,
    package_name: "HSSC-I Pro Access",
    subscribed_plans: ["11th"],
    payment_status: "approved",
    status: "active",
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: "std-khadija-05",
    name: "Khadija Jameel",
    email: "dj.khadijajameel19@gmail.com",
    phone: "+92 300 1234567",
    grade: "MDCAT",
    stream: "Medical (FSc Pre-Medical)",
    is_pro: true,
    package_name: "Full Access MDCAT Mastery",
    subscribed_plans: ["MDCAT", "12th"],
    payment_status: "approved",
    status: "active",
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
];

export interface ServerStudyBuddyLogItem {
  id: string;
  student_id: string;
  student_name?: string;
  student_email?: string;
  role: 'user' | 'model';
  message_text: string;
  created_at: string;
  conversation_id?: string;
}

const STUDY_BUDDY_LOGS_FILE_PATH = path.join(process.cwd(), "data", "study_buddy_logs.json");
const inMemoryStudyBuddyLogs: ServerStudyBuddyLogItem[] = [];

function loadPersistentStudyBuddyLogs() {
  try {
    if (fs.existsSync(STUDY_BUDDY_LOGS_FILE_PATH)) {
      const content = fs.readFileSync(STUDY_BUDDY_LOGS_FILE_PATH, "utf-8");
      if (content) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          inMemoryStudyBuddyLogs.length = 0;
          for (const item of parsed) {
            if (item && item.id) inMemoryStudyBuddyLogs.push(item);
          }
        }
      }
    }
  } catch (err) {
    console.warn("[loadPersistentStudyBuddyLogs warning]:", err);
  }
}

export function savePersistentStudyBuddyLogs() {
  try {
    fs.writeFileSync(STUDY_BUDDY_LOGS_FILE_PATH, JSON.stringify(inMemoryStudyBuddyLogs, null, 2), "utf-8");
  } catch (err) {
    console.warn("[savePersistentStudyBuddyLogs warning]:", err);
  }
}

loadPersistentStudyBuddyLogs();

const inMemoryMCQAttempts: MCQAttemptItem[] = [
  // Ayesha Khan
  { id: "att-seed-1", studentId: "std-ayesha-01", studentEmail: "ayesha.khan.mdcat@gmail.com", subject: "Biology", chapter: "Cell Structure & Bioenergetics", questionId: "bio-q1", questionText: "ATP synthesis in mitochondria", selectedAnswer: 0, correctAnswer: 0, isCorrect: true, timeTakenSeconds: 22, createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: "att-seed-2", studentId: "std-ayesha-01", studentEmail: "ayesha.khan.mdcat@gmail.com", subject: "Biology", chapter: "Coordination & Control", questionId: "bio-q2", questionText: "Action potential in neuron", selectedAnswer: 1, correctAnswer: 1, isCorrect: true, timeTakenSeconds: 19, createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: "att-seed-3", studentId: "std-ayesha-01", studentEmail: "ayesha.khan.mdcat@gmail.com", subject: "Physics", chapter: "Electromagnetism", questionId: "phy-q1", questionText: "Magnetic flux calculation", selectedAnswer: 2, correctAnswer: 1, isCorrect: false, timeTakenSeconds: 45, createdAt: new Date(Date.now() - 6 * 86400000).toISOString() },
  { id: "att-seed-4", studentId: "std-ayesha-01", studentEmail: "ayesha.khan.mdcat@gmail.com", subject: "Physics", chapter: "Rotational Motion", questionId: "phy-q2", questionText: "Moment of inertia of disk", selectedAnswer: 0, correctAnswer: 0, isCorrect: true, timeTakenSeconds: 38, createdAt: new Date(Date.now() - 6 * 86400000).toISOString() },
  { id: "att-seed-5", studentId: "std-ayesha-01", studentEmail: "ayesha.khan.mdcat@gmail.com", subject: "Chemistry", chapter: "Aldehydes & Ketones", questionId: "ch-q1", questionText: "Nucleophilic addition to carbonyl", selectedAnswer: 3, correctAnswer: 1, isCorrect: false, timeTakenSeconds: 35, createdAt: new Date(Date.now() - 4 * 86400000).toISOString() },
  { id: "att-seed-6", studentId: "std-ayesha-01", studentEmail: "ayesha.khan.mdcat@gmail.com", subject: "Chemistry", chapter: "Chemical Equilibrium", questionId: "ch-q2", questionText: "Le Chatelier principle on Haber process", selectedAnswer: 0, correctAnswer: 0, isCorrect: true, timeTakenSeconds: 24, createdAt: new Date(Date.now() - 4 * 86400000).toISOString() },

  // Hamza Ahmed
  { id: "att-seed-7", studentId: "std-hamza-02", studentEmail: "hamza.tcat.prep@gmail.com", subject: "Mathematics", chapter: "Calculus & Differentiation", questionId: "m-q1", questionText: "Derivative of trigonometric functions", selectedAnswer: 1, correctAnswer: 1, isCorrect: true, timeTakenSeconds: 30, createdAt: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: "att-seed-8", studentId: "std-hamza-02", studentEmail: "hamza.tcat.prep@gmail.com", subject: "Mathematics", chapter: "Integration by Parts", questionId: "m-q2", questionText: "Definite integral evaluation", selectedAnswer: 2, correctAnswer: 2, isCorrect: true, timeTakenSeconds: 42, createdAt: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: "att-seed-9", studentId: "std-hamza-02", studentEmail: "hamza.tcat.prep@gmail.com", subject: "Physics", chapter: "Electromagnetism & Waves", questionId: "p-q1", questionText: "Doppler effect frequency shift", selectedAnswer: 0, correctAnswer: 0, isCorrect: true, timeTakenSeconds: 28, createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: "att-seed-10", studentId: "std-hamza-02", studentEmail: "hamza.tcat.prep@gmail.com", subject: "Chemistry", chapter: "Electrochemistry", questionId: "c-q1", questionText: "Standard reduction potential calculation", selectedAnswer: 1, correctAnswer: 2, isCorrect: false, timeTakenSeconds: 50, createdAt: new Date(Date.now() - 5 * 86400000).toISOString() },

  // Zainab Tariq
  { id: "att-seed-11", studentId: "std-zainab-03", studentEmail: "zainab.tariq.fsc@gmail.com", subject: "Biology", chapter: "Evolution & Genetics", questionId: "b-q1", questionText: "Mendelian dihybrid cross ratios", selectedAnswer: 3, correctAnswer: 3, isCorrect: true, timeTakenSeconds: 25, createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: "att-seed-12", studentId: "std-zainab-03", studentEmail: "zainab.tariq.fsc@gmail.com", subject: "Physics", chapter: "Current Electricity", questionId: "p-q2", questionText: "Wheatstone bridge balance condition", selectedAnswer: 0, correctAnswer: 2, isCorrect: false, timeTakenSeconds: 40, createdAt: new Date(Date.now() - 6 * 86400000).toISOString() },

  // Bilal Raza
  { id: "att-seed-13", studentId: "std-bilal-04", studentEmail: "bilal.raza.11th@gmail.com", subject: "Computer Science", chapter: "Data Structures & Algorithms", questionId: "cs-q1", questionText: "Time complexity of binary search", selectedAnswer: 1, correctAnswer: 1, isCorrect: true, timeTakenSeconds: 15, createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: "att-seed-14", studentId: "std-bilal-04", studentEmail: "bilal.raza.11th@gmail.com", subject: "Physics", chapter: "Vectors & Equilibrium", questionId: "p-q3", questionText: "Torque equilibrium conditions", selectedAnswer: 3, correctAnswer: 0, isCorrect: false, timeTakenSeconds: 36, createdAt: new Date(Date.now() - 5 * 86400000).toISOString() },

  // Khadija Jameel
  { id: "att-seed-15", studentId: "std-khadija-05", studentEmail: "dj.khadijajameel19@gmail.com", subject: "Biology", chapter: "Bioenergetics & Respiration", questionId: "bio-k1", questionText: "Krebs cycle ATP and electron yields", selectedAnswer: 2, correctAnswer: 2, isCorrect: true, timeTakenSeconds: 20, createdAt: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: "att-seed-16", studentId: "std-khadija-05", studentEmail: "dj.khadijajameel19@gmail.com", subject: "Chemistry", chapter: "Organic Synthesis", questionId: "ch-k1", questionText: "Grignard reagent preparation", selectedAnswer: 1, correctAnswer: 1, isCorrect: true, timeTakenSeconds: 22, createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: "att-seed-17", studentId: "std-khadija-05", studentEmail: "dj.khadijajameel19@gmail.com", subject: "Physics", chapter: "Atomic & Nuclear Physics", questionId: "phy-k1", questionText: "Half-life and decay constant", selectedAnswer: 0, correctAnswer: 0, isCorrect: true, timeTakenSeconds: 28, createdAt: new Date(Date.now() - 7 * 86400000).toISOString() },
];

export interface SavedTestResultItem {
  id: string;
  student_id: string;
  student_name?: string;
  student_email?: string;
  subject: string;
  path_label: string;
  score: number;
  total: number;
  percentage: number;
  duration: string;
  time_taken_seconds?: number;
  date_str: string;
  created_at: string;
  hidden_from_student?: boolean;
}

const TEST_RESULTS_FILE_PATH = path.join(process.cwd(), "data", "test_results.json");
const inMemoryTestResults: SavedTestResultItem[] = [];

function loadPersistentTestResults() {
  try {
    if (fs.existsSync(TEST_RESULTS_FILE_PATH)) {
      const content = fs.readFileSync(TEST_RESULTS_FILE_PATH, "utf-8");
      if (content) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          inMemoryTestResults.length = 0;
          for (const item of parsed) {
            if (item && item.id) inMemoryTestResults.push(item);
          }
        }
      }
    }
  } catch (err) {
    console.warn("[loadPersistentTestResults warning]:", err);
  }
}

export function savePersistentTestResults() {
  try {
    fs.writeFileSync(TEST_RESULTS_FILE_PATH, JSON.stringify(inMemoryTestResults, null, 2), "utf-8");
  } catch (err) {
    console.warn("[savePersistentTestResults warning]:", err);
  }
}

loadPersistentTestResults();

export interface ServerTestSessionRecord {
  id: string;
  session_id: string;
  student_id: string;
  student_email?: string;
  student_name?: string;
  subject: string;
  path_label: string;
  status: 'in_progress' | 'submitted' | 'abandoned';
  total_questions: number;
  total?: number;
  mcqs_attempted: number;
  score?: number;
  percentage?: number;
  duration?: string;
  time_taken_seconds?: number;
  date_str?: string;
  created_at: string;
  updated_at?: string;
  submitted_at?: string;
  test_result_id?: string;
  questions_count?: number;
}

const TEST_SESSIONS_FILE_PATH = path.join(process.cwd(), "data", "test_sessions.json");
const persistentTestSessions = new Map<string, ServerTestSessionRecord>();

function loadPersistentSessions() {
  try {
    if (fs.existsSync(TEST_SESSIONS_FILE_PATH)) {
      const content = fs.readFileSync(TEST_SESSIONS_FILE_PATH, "utf-8");
      if (content) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          for (const s of parsed) {
            if (s && (s.session_id || s.id)) {
              const sid = s.session_id || s.id;
              persistentTestSessions.set(sid, s);
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn("[loadPersistentSessions warning]:", err);
  }

  // Seed baseline sessions from inMemoryTestResults if not already present
  for (const item of inMemoryTestResults) {
    const sessId = `sess-${item.id}`;
    if (!persistentTestSessions.has(sessId) && !Array.from(persistentTestSessions.values()).some(s => s.test_result_id === item.id)) {
      persistentTestSessions.set(sessId, {
        id: sessId,
        session_id: sessId,
        student_id: item.student_id,
        student_email: item.student_email,
        student_name: item.student_name || item.student_email || item.student_id,
        subject: item.subject,
        path_label: item.path_label,
        status: 'submitted',
        total_questions: item.total,
        total: item.total,
        mcqs_attempted: item.total,
        score: item.score,
        percentage: item.percentage,
        duration: item.duration,
        time_taken_seconds: item.time_taken_seconds || 0,
        date_str: item.date_str,
        created_at: item.created_at,
        updated_at: item.created_at,
        submitted_at: item.created_at,
        test_result_id: item.id,
        questions_count: item.total,
      });
    }
  }
}

function savePersistentSessions() {
  try {
    const list = Array.from(persistentTestSessions.values());
    fs.writeFileSync(TEST_SESSIONS_FILE_PATH, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    console.warn("[savePersistentSessions warning]:", err);
  }
}

// Initial load on server start
loadPersistentSessions();

async function logStudentMcqAttempts(
  studentId: string,
  studentEmail: string | undefined,
  subject: string,
  attempts: any[]
): Promise<{ success: boolean; count: number }> {
  if (!studentId || !Array.isArray(attempts) || attempts.length === 0) {
    return { success: false, count: 0 };
  }

  const nowIso = new Date().toISOString();
  const canonSubject = normalizeSubjectKey(subject || attempts[0]?.subject || "Mathematics");

  const formattedAttempts: MCQAttemptItem[] = attempts.map((a: any, idx: number) => ({
    id: `att-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
    studentId,
    studentEmail: studentEmail || "",
    subject: canonSubject,
    chapter: a.chapter || a.topic || "General Concepts",
    questionId: String(a.questionId || a.id || `q-${idx}`),
    questionText: a.questionText || a.q || "",
    selectedAnswer: Number(a.selectedAnswer ?? -1),
    correctAnswer: Number(a.correctAnswer ?? a.correct ?? 0),
    isCorrect: Boolean(a.isCorrect),
    timeTakenSeconds: Math.max(1, Number(a.timeTakenSeconds || a.timeSpentSeconds) || 15),
    createdAt: nowIso,
  }));

  // 1. Add to in-memory store
  inMemoryMCQAttempts.push(...formattedAttempts);

  // 2. Persist to Supabase mcq_attempts table if available
  if (getAuthClient(null)) {
    try {
      const rowsToInsert = formattedAttempts.map((item) => ({
        student_id: item.studentId,
        student_email: item.studentEmail,
        subject: item.subject,
        chapter: item.chapter,
        question_id: item.questionId,
        question_text: item.questionText,
        selected_answer: item.selectedAnswer,
        correct_answer: item.correctAnswer,
        is_correct: item.isCorrect,
        time_taken_seconds: item.timeTakenSeconds,
        created_at: item.createdAt,
      }));

      const { error } = await getAuthClient(null)?.from("mcq_attempts").insert(rowsToInsert);
      if (error) {
        console.warn("[Supabase mcq_attempts log warning]:", error.message);
      } else {
        console.log(`[Supabase mcq_attempts log success]: Inserted ${rowsToInsert.length} attempts for student ${studentId}`);
      }
    } catch (err: any) {
      console.warn("[Supabase mcq_attempts insert exception]:", err?.message || err);
    }
  }

  return { success: true, count: formattedAttempts.length };
}

export interface StudentWeaknessProfile {
  studentId: string;
  studentEmail?: string;
  subject: string;
  totalAttempts: number;
  correctAttempts: number;
  overallAccuracy: number;
  avgTimePerQuestionSeconds: number;
  trend: "improving" | "declining" | "stable" | "insufficient_data";
  weakestTopics: Array<{
    chapter: string;
    total: number;
    correct: number;
    accuracy: number;
    avgTime: number;
  }>;
  strongestTopics: Array<{
    chapter: string;
    total: number;
    correct: number;
    accuracy: number;
    avgTime: number;
  }>;
  chapterBreakdown: Array<{
    chapter: string;
    total: number;
    correct: number;
    accuracy: number;
    avgTime: number;
  }>;
  promptContext: string;
}

async function getStudentWeaknessProfile(
  studentId: string,
  subject?: string,
  studentEmail?: string
): Promise<StudentWeaknessProfile> {
  const normSub = subject ? normalizeSubjectKey(subject) : undefined;
  const cleanEmail = studentEmail
    ? studentEmail.trim().toLowerCase()
    : (studentId?.includes("@") ? studentId.trim().toLowerCase() : undefined);
  let allAttempts: MCQAttemptItem[] = [];

  // 1. Get in-memory attempts
  const memFiltered = inMemoryMCQAttempts.filter((a) => {
    const matchesUser =
      (studentId && a.studentId === studentId) ||
      (cleanEmail && a.studentEmail && a.studentEmail.toLowerCase() === cleanEmail) ||
      (cleanEmail && a.studentId && a.studentId.toLowerCase() === cleanEmail);
    const matchesSub = normSub ? a.subject.toLowerCase() === normSub.toLowerCase() : true;
    return matchesUser && matchesSub;
  });
  allAttempts.push(...memFiltered);

  // 2. Query Supabase attempts
  if (supabaseServer && (studentId || cleanEmail)) {
    try {
      let query = supabaseServer.from("mcq_attempts").select("*");

      if (cleanEmail && studentId && !studentId.includes("@")) {
        query = query.or(`student_id.eq.${studentId},student_email.eq.${cleanEmail}`);
      } else if (cleanEmail) {
        query = query.or(`student_id.eq.${cleanEmail},student_email.eq.${cleanEmail}`);
      } else {
        query = query.eq("student_id", studentId);
      }

      if (normSub) {
        query = query.eq("subject", normSub);
      }

      const { data, error } = await query.order("created_at", { ascending: true });
      if (!error && Array.isArray(data) && data.length > 0) {
        const dbAttempts: MCQAttemptItem[] = data.map((row: any) => ({
          id: String(row.id),
          studentId: row.student_id,
          studentEmail: row.student_email,
          subject: row.subject,
          chapter: row.chapter,
          questionId: row.question_id,
          questionText: row.question_text,
          selectedAnswer: row.selected_answer,
          correctAnswer: row.correct_answer,
          isCorrect: Boolean(row.is_correct),
          timeTakenSeconds: row.time_taken_seconds || 15,
          createdAt: row.created_at,
        }));

        // Deduplicate with in-memory by id
        const existingIds = new Set(allAttempts.map((a) => a.id));
        for (const dba of dbAttempts) {
          if (!existingIds.has(dba.id)) {
            allAttempts.push(dba);
          }
        }
      }
    } catch (err: any) {
      console.warn("[getStudentWeaknessProfile Supabase fetch warning]:", err?.message || err);
    }
  }

  const targetSub = normSub || (allAttempts[0]?.subject || "Mathematics");

  if (allAttempts.length === 0) {
    return {
      studentId,
      subject: targetSub,
      totalAttempts: 0,
      correctAttempts: 0,
      overallAccuracy: 0,
      avgTimePerQuestionSeconds: 0,
      trend: "insufficient_data",
      weakestTopics: [],
      strongestTopics: [],
      chapterBreakdown: [],
      promptContext: "",
    };
  }

  const totalAttempts = allAttempts.length;
  const correctAttempts = allAttempts.filter((a) => a.isCorrect).length;
  const overallAccuracy = Math.round((correctAttempts / totalAttempts) * 100);
  const totalTime = allAttempts.reduce((sum, a) => sum + (a.timeTakenSeconds || 15), 0);
  const avgTimePerQuestionSeconds = Math.round(totalTime / totalAttempts);

  // Aggregate by chapter
  const chapterMap: Record<string, { total: number; correct: number; totalTime: number }> = {};
  for (const item of allAttempts) {
    const ch = item.chapter || "General Concepts";
    if (!chapterMap[ch]) {
      chapterMap[ch] = { total: 0, correct: 0, totalTime: 0 };
    }
    chapterMap[ch].total += 1;
    if (item.isCorrect) chapterMap[ch].correct += 1;
    chapterMap[ch].totalTime += item.timeTakenSeconds || 15;
  }

  const chapterStats = Object.keys(chapterMap).map((ch) => {
    const c = chapterMap[ch];
    const acc = Math.round((c.correct / c.total) * 100);
    const avgT = Math.round(c.totalTime / c.total);
    return {
      chapter: ch,
      total: c.total,
      correct: c.correct,
      accuracy: acc,
      avgTime: avgT,
    };
  });

  // Sort by accuracy ascending for weakest
  chapterStats.sort((a, b) => a.accuracy - b.accuracy);
  const weakestTopics = chapterStats.filter((c) => c.accuracy < 60 || chapterStats.length <= 3).slice(0, 3);

  // Sort by accuracy descending for strongest
  const sortedDesc = [...chapterStats].sort((a, b) => b.accuracy - a.accuracy);
  const strongestTopics = sortedDesc.filter((c) => c.accuracy >= 65 || chapterStats.length <= 3).slice(0, 3);

  // Calculate trend: compare recent 5 attempts vs earlier attempts
  let trend: "improving" | "declining" | "stable" | "insufficient_data" = "stable";
  if (totalAttempts >= 6) {
    const recent5 = allAttempts.slice(-5);
    const earlier = allAttempts.slice(0, -5);
    const recentAcc = Math.round((recent5.filter((a) => a.isCorrect).length / 5) * 100);
    const earlierAcc = Math.round((earlier.filter((a) => a.isCorrect).length / earlier.length) * 100);

    if (recentAcc >= earlierAcc + 10) trend = "improving";
    else if (recentAcc <= earlierAcc - 10) trend = "declining";
    else trend = "stable";
  }

  const weakTopicNames = weakestTopics.map((w) => `${w.chapter} (${w.accuracy}% accuracy, avg ${w.avgTime}s/q)`).join(", ");
  const strongTopicNames = strongestTopics.map((s) => `${s.chapter} (${s.accuracy}% accuracy)`).join(", ");

  const promptContext = `=== ADAPTIVE LEARNING & WEAKNESS PROFILE CONTEXT ===
- Student ID: ${studentId}
- Subject: ${targetSub} (${overallAccuracy}% overall accuracy across ${totalAttempts} attempts, avg ${avgTimePerQuestionSeconds}s/question)
- Performance Trend: ${trend.toUpperCase()}
- WEAKEST TOPICS (REMEDIATION TARGETS): ${weakTopicNames || "None flagged"}
- STRONGEST TOPICS (CONFIDENCE BUILDERS): ${strongTopicNames || "General"}
- MANDATORY INSTRUCTION FOR GEMINI: This is a personalized practice test. Focus approximately 60-70% of the generated questions specifically on reinforcing the student's weakest topics (${weakestTopics.map((w) => w.chapter).join(", ")}), testing core definitions, direct calculations, key formulas, and common calculation error distractors. Include 2-3 questions (~20-30%) from their stronger topics (${strongestTopics.map((s) => s.chapter).join(", ")}) to build confidence.`;

  return {
    studentId,
    subject: targetSub,
    totalAttempts,
    correctAttempts,
    overallAccuracy,
    avgTimePerQuestionSeconds,
    trend,
    weakestTopics,
    strongestTopics,
    chapterBreakdown: chapterStats,
    promptContext,
  };
}

/**
 * Retrieves all normalized question stems seen by a student across in-memory and Supabase attempts.
 */
async function getSeenQuestionStemsForStudent(
  studentId: string,
  studentEmail?: string,
  subject?: string
): Promise<Set<string>> {
  const seenStems = new Set<string>();
  if (!studentId && !studentEmail) return seenStems;

  const normSub = subject ? normalizeSubjectKey(subject).toLowerCase() : undefined;
  const cleanEmail = studentEmail ? studentEmail.trim().toLowerCase() : (studentId?.includes("@") ? studentId.trim().toLowerCase() : "");

  // 1. In-memory attempts
  for (const item of inMemoryMCQAttempts) {
    const matchStudent = item.studentId === studentId || (cleanEmail && item.studentEmail?.toLowerCase() === cleanEmail);
    if (!matchStudent) continue;
    if (normSub && item.subject && !item.subject.toLowerCase().includes(normSub) && !normSub.includes(item.subject.toLowerCase())) {
      continue;
    }
    const stem = normalizeQuestionStem(item.questionText || "");
    if (stem) seenStems.add(stem);
  }

  // 2. Supabase mcq_attempts table
  const client = getAuthClient(null) || getSupabaseAdminClient() || supabaseServer;
  if (client) {
    try {
      let query = client.from("mcq_attempts").select("question_text, subject");
      if (studentId && studentId !== "guest") {
        query = query.or(`student_id.eq.${studentId}${cleanEmail ? `,student_email.eq.${cleanEmail}` : ""}`);
      } else if (cleanEmail) {
        query = query.eq("student_email", cleanEmail);
      } else {
        return seenStems;
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        for (const row of data) {
          if (normSub && row.subject && !row.subject.toLowerCase().includes(normSub) && !normSub.includes(row.subject.toLowerCase())) {
            continue;
          }
          const stem = normalizeQuestionStem(row.question_text || "");
          if (stem) seenStems.add(stem);
        }
      }
    } catch (err: any) {
      console.warn("[getSeenQuestionStemsForStudent fetch warning]:", err?.message || err);
    }
  }

  return seenStems;
}

export function extractCleanErrorMessage(err: any): string {
  if (!err) return "Unknown error";
  let msg = typeof err === "string" ? err : err.message || String(err);
  for (let i = 0; i < 4; i++) {
    if (typeof msg === "string" && (msg.trim().startsWith("{") || msg.trim().startsWith("["))) {
      try {
        const parsed = JSON.parse(msg.trim());
        if (parsed.error) {
          if (typeof parsed.error === "string") {
            msg = parsed.error;
          } else if (parsed.error.message) {
            msg = parsed.error.message;
          } else {
            break;
          }
        } else if (parsed.message) {
          msg = parsed.message;
        } else {
          break;
        }
      } catch {
        break;
      }
    } else {
      break;
    }
  }
  return typeof msg === "string" ? msg.trim() : JSON.stringify(msg);
}

export function getGeminiApiKey(customEnv?: Record<string, any>): string {
  const candidates = [
    customEnv?.GEMINI_API_KEY,
    customEnv?.GEMINI_API_KEY_1,
    customEnv?.GEMINI_API_KEY_2,
    customEnv?.GEMINI_API_KEY_3,
    customEnv?.GEMINI_API_KEY_4,
    customEnv?.VITE_GEMINI_API_KEY,
    customEnv?.GOOGLE_API_KEY,
    getEnvVar("GEMINI_API_KEY"),
    getEnvVar("GEMINI_API_KEY_1"),
    getEnvVar("GEMINI_API_KEY_2"),
    getEnvVar("GEMINI_API_KEY_3"),
    getEnvVar("GEMINI_API_KEY_4"),
    getEnvVar("VITE_GEMINI_API_KEY"),
    getEnvVar("GOOGLE_API_KEY"),
    getEnvVar("API_KEY"),
    getEnvVar("GEMINI_KEY"),
  ]
    .filter((k): k is string => Boolean(k && typeof k === "string" && k.trim().length > 0 && k !== "MY_GEMINI_API_KEY"))
    .map((k) => k.replace(/^["']|["']$/g, "").trim());

  const structuredKey = candidates.find((k) => k.startsWith("AIza") || k.startsWith("AQ."));
  return (structuredKey || candidates[0] || "").trim();
}

export function getGeminiKeyDetails(): { found: boolean; keySource: string; keyLength: number } {
  const sources = [
    { name: "GEMINI_API_KEY", val: getEnvVar("GEMINI_API_KEY") },
    { name: "GEMINI_API_KEY_2", val: getEnvVar("GEMINI_API_KEY_2") },
    { name: "VITE_GEMINI_API_KEY", val: getEnvVar("VITE_GEMINI_API_KEY") },
    { name: "GOOGLE_API_KEY", val: getEnvVar("GOOGLE_API_KEY") },
    { name: "API_KEY", val: getEnvVar("API_KEY") },
  ];

  for (const s of sources) {
    if (s.val && s.val.trim().length > 0 && s.val !== "MY_GEMINI_API_KEY") {
      const cleanVal = s.val.replace(/^["']|["']$/g, "").trim();
      if (cleanVal.length > 0) {
        return { found: true, keySource: s.name, keyLength: cleanVal.length };
      }
    }
  }

  const fallback = getGeminiApiKey();
  if (fallback) {
    return { found: true, keySource: "candidates_fallback", keyLength: fallback.length };
  }
  return { found: false, keySource: "NONE (Checked GEMINI_API_KEY, GEMINI_API_KEY_2, VITE_GEMINI_API_KEY, GOOGLE_API_KEY)", keyLength: 0 };
}

export async function withGeminiNativeAuth<T>(apiKey: string, fn: () => Promise<T>): Promise<T> {
  const originalFetch = globalThis.fetch;
  const geminiFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const urlStr = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;
    let targetUrl = urlStr;

    if (urlStr.includes("generativelanguage.googleapis.com")) {
      if (apiKey && !targetUrl.includes("key=")) {
        const sep = targetUrl.includes("?") ? "&" : "?";
        targetUrl = `${targetUrl}${sep}key=${encodeURIComponent(apiKey)}`;
      }
    }

    const newInit: RequestInit = { ...init };
    const headers = new Headers(
      newInit.headers || (typeof input === "object" && input && "headers" in input ? (input as Request).headers : {})
    );

    // CRITICAL: Strip any Authorization header to prevent 401 ACCESS_TOKEN_TYPE_UNSUPPORTED
    headers.delete("Authorization");
    headers.delete("authorization");

    if (apiKey) {
      headers.set("x-goog-api-key", apiKey);
    }

    newInit.headers = headers;

    if (typeof input === "object" && input && !(input instanceof URL) && "url" in input) {
      return originalFetch(new Request(targetUrl, newInit));
    }
    return originalFetch(targetUrl, newInit);
  };

  try {
    globalThis.fetch = geminiFetch as typeof fetch;
    return await fn();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    console.warn("[Gemini Config] No valid Gemini API key found in process.env or globalThis. (Checked GEMINI_API_KEY, GEMINI_API_KEY_2, VITE_GEMINI_API_KEY, GOOGLE_API_KEY)");
    return null;
  }
  try {
    const keyPreview = apiKey.length > 8 ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : "set";
    console.log(`[Gemini Config] Initializing GoogleGenAI client with key: ${keyPreview} (length: ${apiKey.length})`);
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "x-goog-api-key": apiKey,
          "User-Agent": "aistudio-build",
        },
      },
    });
  } catch (err: any) {
    console.error("[Gemini Config Error] Failed to instantiate GoogleGenAI client:", err?.message || err);
    return null;
  }
}

export interface MCQQuestion {
  id: string;
  q: string;
  options: string[];
  correct: number;
  topic: string;
  explain: string;
  difficulty: string;
}

// Helper to map any subject variant/string to a canonical key strictly
function normalizeSubjectKey(subject: string): string {
  if (!subject) return "Physics";
  const clean = subject.trim();
  const lower = clean.toLowerCase();

  if (lower.includes("physic")) return "Physics";
  if (lower.includes("chem")) return "Chemistry";
  if (lower.includes("bio") || lower.includes("botany") || lower.includes("zoology")) return "Biology";
  if (lower.includes("math")) return "Mathematics";
  if (lower.includes("computer") || lower === "cs" || lower.includes("it")) return "Computer Science";
  if (lower.includes("english") || lower.includes("verbal")) return "English";
  if (lower.includes("urdu")) return "Urdu";
  if (lower.includes("islam") || lower.includes("din")) return "Islamiat";
  if (lower.includes("pak") || lower.includes("pakistan")) return "Pakistan Studies";

  return clean;
}

function shuffleQuestionOptions<T extends { options: string[]; correct: number }>(q: T): T {
  if (!q || !Array.isArray(q.options) || q.options.length < 2) return q;

  const originalCorrectIdx = typeof q.correct === 'number' && q.correct >= 0 && q.correct < q.options.length ? q.correct : 0;
  const correctText = q.options[originalCorrectIdx];
  if (correctText === undefined) return q;

  const shuffledOptions = [...q.options];
  for (let i = shuffledOptions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
  }

  const newCorrectIndex = shuffledOptions.indexOf(correctText);

  return {
    ...q,
    options: shuffledOptions,
    correct: newCorrectIndex >= 0 ? newCorrectIndex : originalCorrectIdx,
  };
}

// Hard constraint topic relevance filter for MCQ question generation
function checkQuestionTopicRelevance(
  qText: string,
  reportedTopic: string | undefined,
  options: string[],
  explainText: string,
  targetTopicName: string,
  subject: string
): boolean {
  if (!targetTopicName) return true;

  const cleanTarget = targetTopicName.trim();
  const lowerTarget = cleanTarget.toLowerCase();
  const normSub = normalizeSubjectKey(subject).toLowerCase();

  // If topic is generic syllabus-wide or "All Topics", skip strict chapter filtering
  if (
    lowerTarget === 'all topics' ||
    lowerTarget === 'full syllabus' ||
    lowerTarget === 'all chapters' ||
    lowerTarget === `${normSub} syllabus` ||
    lowerTarget === `${normSub} board syllabus` ||
    lowerTarget === `${normSub} fbise syllabus` ||
    lowerTarget === `${normSub} core curriculum` ||
    lowerTarget.includes('all chapter') ||
    lowerTarget.includes('full mock') ||
    lowerTarget.includes('full exam')
  ) {
    return true;
  }

  // 1. Tokenize target topic name and remove common filler/stop words
  const stopWords = new Set([
    'and', 'or', 'the', 'of', 'in', 'to', 'a', 'an', 'for', 'with', 'on', 'at', 'by', 'from',
    'chapter', 'subtopic', 'topic', 'unit', 'lesson', 'fbise', 'mdcat', 'pmdc', 'class', '9', '10', '11', '12',
    'part', 'section', 'mcqs', 'mcq', 'practice', 'test', 'exam'
  ]);

  const rawTokens = lowerTarget
    .replace(/[^a-z0-9\u0600-\u06FF\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length >= 3 && !stopWords.has(t));

  // If no specific topic tokens remain after filtering stop words, allow
  if (rawTokens.length === 0) return true;

  const fullText = (
    qText + ' ' +
    (reportedTopic || '') + ' ' +
    (explainText || '') + ' ' +
    (options || []).join(' ')
  ).toLowerCase();

  const lowerReportedTopic = (reportedTopic || '').toLowerCase();

  // 2. Direct topic match in reported topic or full text
  let tokenMatchCount = 0;
  for (const token of rawTokens) {
    const stem = token.length > 5 ? token.substring(0, token.length - 2) : token;
    if (fullText.includes(token) || fullText.includes(stem)) {
      tokenMatchCount++;
    }
  }

  // If reported topic contains the target topic phrase AND reported topic is distinct from default label, check it
  if (reportedTopic && lowerReportedTopic !== lowerTarget && lowerReportedTopic.length > 3 && !lowerReportedTopic.includes("core curriculum") && !lowerReportedTopic.includes("syllabus")) {
    if (lowerReportedTopic.includes(lowerTarget) || (rawTokens.length > 0 && rawTokens.every(t => lowerReportedTopic.includes(t)))) {
      return true;
    }
  }

  // Topic specific dictionary mappings for major Board Exams & PMDC MDCAT chapters
  const TOPIC_CONCEPT_MAP: Record<string, string[]> = {
    "physical quantities": ["physical", "quantity", "quantities", "unit", "si unit", "dimension", "dimensional", "base", "derived", "scalar", "vector", "measurement", "precision", "accuracy", "least count", "error", "uncertainty", "significant figures", "prefix", "vernier", "caliper", "gauge", "kelvin", "meter", "kilogram", "second", "ampere", "candela", "mole"],
    "base quantities": ["base", "quantity", "quantities", "unit", "si unit", "dimension", "dimensional", "fundamental", "length", "mass", "time", "electric current", "temperature", "amount of substance", "luminous intensity", "meter", "kilogram", "second", "ampere", "kelvin", "mole", "candela", "derived", "measurement", "least count", "precision", "accuracy", "error", "uncertainty", "significant figures"],
    "base quantity": ["base", "quantity", "quantities", "unit", "si unit", "dimension", "dimensional", "fundamental", "length", "mass", "time", "electric current", "temperature", "amount of substance", "luminous intensity", "meter", "kilogram", "second", "ampere", "kelvin", "mole", "candela", "derived", "measurement", "least count", "precision", "accuracy", "error", "uncertainty", "significant figures"],
    "derived quantities": ["derived", "quantity", "quantities", "unit", "si unit", "dimension", "dimensional", "velocity", "force", "acceleration", "work", "power", "pressure", "newton", "joule", "watt", "pascal", "base"],
    "units and dimensions": ["unit", "dimension", "dimensional", "si unit", "base", "derived", "formula", "dimensional analysis", "least count", "error", "uncertainty"],
    "measurement": ["measurement", "physical", "quantity", "quantities", "unit", "si unit", "dimension", "dimensional", "least count", "vernier", "screw gauge", "error", "uncertainty", "significant figures"],
    "vectors and equilibrium": ["vector", "vectors", "cross product", "dot product", "resultant", "torque", "equilibrium", "moment arm", "component", "unit vector", "null vector", "scalar product", "center of gravity"],
    "motion and force": ["motion", "force", "newton", "momentum", "impulse", "projectile", "trajectory", "friction", "velocity", "acceleration", "displacement", "inertia"],
    "work and energy": ["work", "energy", "power", "kinetic", "potential", "joule", "watt", "conservation of energy", "work energy theorem", "gravitational potential"],
    "circular motion": ["circular", "centripetal", "angular", "radian", "frequency", "period", "geostationary", "moment of inertia", "banked curve"],
    "fluid dynamics": ["fluid", "viscosity", "bernoulli", "terminal velocity", "laminar", "turbulent", "equation of continuity", "poiseuille", "stokes law"],
    "oscillations": ["oscillation", "oscillations", "shm", "simple harmonic", "pendulum", "resonance", "damping", "restoring force", "amplitude", "frequency"],
    "waves": ["wave", "waves", "doppler", "transverse", "longitudinal", "superposition", "interference", "node", "antinode", "standing wave", "diffraction", "speed of sound"],
    "physical optics": ["optics", "interference", "diffraction", "polarization", "youngs double slit", "huygens", "diffraction grating", "thin film", "brewsters law"],
    "electrostatics": ["electrostatic", "electrostatics", "coulomb", "electric field", "electric potential", "capacitance", "capacitor", "dielectric", "gauss law", "permittivity"],
    "current electricity": ["current", "resistance", "resistor", "ohms law", "kirchhoff", "wheatstone", "potentiometer", "resistivity", "emf", "drift velocity"],
    "electromagnetism": ["magnetic", "magnetism", "solenoid", "lorentz", "biot savart", "ampere law", "flux", "galvanometer", "tesla"],
    "electromagnetic induction": ["induction", "faraday", "lenz", "eddy current", "transformer", "inductance", "henry", "generator", "back emf"],
    "alternating current": ["alternating current", "ac circuit", "impedance", "reactance", "rms", "peak value", "power factor", "choke coil", "resonance circuit"],
    "physics of solids": ["solid", "solids", "stress", "strain", "youngs modulus", "crystalline", "amorphous", "semiconductor", "hysteresis", "elasticity"],
    "electronics": ["transistor", "diode", "pn junction", "rectifier", "operational amplifier", "op amp", "gain", "logic gate", "biasing"],
    "dawn of modern physics": ["photoelectric", "compton", "de broglie", "photon", "blackbody", "work function", "pair production", "relativity", "quantum"],
    "atomic spectra": ["atomic spectra", "bohr", "rydberg", "lyman", "balmer", "paschen", "laser", "x-ray", "energy level"],
    "nuclear physics": ["nuclear", "radioactivity", "alpha", "beta", "gamma", "half life", "binding energy", "mass defect", "fission", "fusion", "decay"],
    "matrices and determinants": ["matrix", "matrices", "determinant", "determinants", "singular", "non singular", "adjoint", "inverse", "cramers rule", "echelon", "transpose"],
    "quadratic equations": ["quadratic", "discriminant", "roots", "synthetic division", "nature of roots", "quadratic formula"],
    "complex numbers": ["complex number", "complex numbers", "imaginary", "iota", "modulus", "argument", "conjugate", "de moivre"],
    "differentiation": ["derivative", "derivatives", "differentiation", "tangent", "normal", "rate of change", "chain rule", "product rule", "quotient rule"],
    "integration": ["integral", "integrals", "integration", "antiderivative", "definite integral", "area under curve", "by parts", "partial fractions"],
    "cell biology": ["cell", "mitochondria", "organelle", "ribosome", "membrane", "endoplasmic", "golgi", "nucleus", "cytoplasm", "lysosome", "chloroplast"],
    "cell structure and function": ["cell", "mitochondria", "organelle", "ribosome", "membrane", "endoplasmic", "golgi", "nucleus", "cytoplasm", "lysosome", "chloroplast", "fluid mosaic"],
    "the science of biology": ["biology", "living", "organism", "scientific method", "hypothesis", "deduction", "theory", "law", "experiment", "branches of biology", "levels of organization"],
    "fundamental concepts": ["biology", "living", "organism", "life", "cell", "scientific method", "hypothesis", "theory", "law", "experiment", "branches of biology", "levels of organization", "metabolism", "homeostasis", "reproduction", "characteristics of life", "biomolecules", "carbohydrate", "protein", "lipid", "water"],
    "core fundamentals": ["biology", "living", "organism", "life", "cell", "scientific method", "hypothesis", "theory", "law", "experiment", "branches of biology", "levels of organization", "metabolism", "homeostasis"],
    "biological molecules": ["carbohydrate", "protein", "lipid", "amino acid", "enzyme", "nucleic acid", "dna", "rna", "peptide", "monosaccharide", "water", "hydrogen bond"],
    "bio molecules": ["carbohydrate", "protein", "lipid", "amino acid", "enzyme", "nucleic acid", "dna", "rna", "peptide", "monosaccharide", "water", "hydrogen bond"],
    "water properties": ["water", "polar", "polarity", "hydrogen bond", "hydrogen bonding", "solvent", "heat capacity", "heat of vaporization", "cohesion", "adhesion", "surface tension", "density of ice", "specific heat"],
    "properties of water": ["water", "polar", "polarity", "hydrogen bond", "hydrogen bonding", "solvent", "heat capacity", "heat of vaporization", "cohesion", "adhesion", "surface tension", "density of ice", "specific heat"],
    "carbohydrates": ["carbohydrate", "monosaccharide", "glucose", "fructose", "galactose", "disaccharide", "sucrose", "lactose", "maltose", "polysaccharide", "starch", "glycogen", "cellulose", "chitin", "glycosidic", "reducing sugar"],
    "lipids": ["lipid", "fatty acid", "triglyceride", "glycerol", "phospholipid", "steroid", "cholesterol", "wax", "ester bond", "saturated", "unsaturated"],
    "proteins": ["protein", "amino acid", "peptide bond", "polypeptide", "primary structure", "secondary structure", "tertiary structure", "quaternary structure", "denaturation", "zwitterion"],
    "nucleic acids": ["nucleic acid", "dna", "rna", "nucleotide", "purine", "pyrimidine", "adenine", "thymine", "guanine", "cytosine", "uracil", "double helix"],
    "enzymes": ["enzyme", "active site", "substrate", "lock and key", "induced fit", "competitive inhibition", "non-competitive", "vmax", "km", "coenzyme", "cofactor"],
    "bioenergetics": ["photosynthesis", "light reaction", "dark reaction", "calvin cycle", "photophosphorylation", "chlorophyll", "rubisco", "respiration", "glycolysis", "krebs cycle", "electron transport chain", "atp"],
    "chemical equilibrium": ["equilibrium", "le chatelier", "kc", "kp", "solubility product", "common ion", "buffer", "reversible"],
    "stoichiometry": ["mole", "avogadro", "molar mass", "empirical formula", "limiting reactant", "percentage yield", "stoichiometry"]
  };

  const targetParts = lowerTarget.split(/\s*[-:–—]\s*/);
  const subtopicKey = targetParts.length > 1 ? targetParts[targetParts.length - 1].trim() : lowerTarget;

  let conceptKeywords: string[] = [];
  if (TOPIC_CONCEPT_MAP[subtopicKey]) {
    conceptKeywords = TOPIC_CONCEPT_MAP[subtopicKey];
  } else if (TOPIC_CONCEPT_MAP[lowerTarget]) {
    conceptKeywords = TOPIC_CONCEPT_MAP[lowerTarget];
  } else {
    for (const [key, keywords] of Object.entries(TOPIC_CONCEPT_MAP)) {
      if (subtopicKey.includes(key) || key.includes(subtopicKey)) {
        conceptKeywords = keywords;
        break;
      }
    }
    if (conceptKeywords.length === 0) {
      for (const [key, keywords] of Object.entries(TOPIC_CONCEPT_MAP)) {
        if (lowerTarget.includes(key) || key.includes(lowerTarget)) {
          conceptKeywords = keywords;
          break;
        }
      }
    }
  }

  if (conceptKeywords.length > 0) {
    const hasConceptMatch = conceptKeywords.some(k => fullText.includes(k.toLowerCase()));
    if (!hasConceptMatch) {
      return false;
    }
  } else {
    // Generic topic match: at least 1 topic token must match
    const isIntroductory = ["fundamental", "concepts", "concept", "intro", "basic", "basics", "principles", "core"].some(ig => subtopicKey.includes(ig));
    if (!isIntroductory && tokenMatchCount === 0) {
      return false;
    }
  }

  const normalizedFullText = fullText.replace(/[\u2018\u2019’`']/g, "'");

  // 3. Collision / Off-topic Filter (Discard questions clearly belonging to unrelated chapters)
  if (lowerTarget.includes("physical quantit") || lowerTarget.includes("measurement") || lowerTarget.includes("si unit")) {
    const forbiddenChapterTerms = [
      "projectile", "trajectory", "angle of projection",
      "newton", "second law", "third law", "rate of change of momentum", "conservation of momentum",
      "harmonic motion", "simple harmonic", "simple pendulum", "extreme positions", "shm",
      "bernoulli", "terminal velocity", "viscosity", "poiseuille", "fluid dynamics",
      "magnetic flux", "flux density", "parallel plate", "capacitor", "capacitance", "dielectric",
      "faraday", "lenz", "eddy current", "photoelectric",
      "half life", "binding energy", "fission", "fusion",
      "mitochondria", "chloroplast", "quadratic formula",
      "cramer's rule", "derivative of", "integral of", "matrix", "determinant", "vsepr", "sn1", "sn2", "le chatelier"
    ];
    for (const forbidden of forbiddenChapterTerms) {
      if (normalizedFullText.includes(forbidden)) {
        return false;
      }
    }
  } else if (lowerTarget.includes("vector") || lowerTarget.includes("equilibrium")) {
    const forbiddenChapterTerms = [
      "projectile", "bernoulli", "simple harmonic", "shm", "magnetic flux", "faraday",
      "photoelectric", "half life", "binding energy", "fission", "fusion", "mitochondria",
      "chloroplast", "derivative of", "integral of", "matrix", "cramer's rule", "le chatelier"
    ];
    for (const forbidden of forbiddenChapterTerms) {
      if (normalizedFullText.includes(forbidden)) return false;
    }
  } else if (lowerTarget.includes("cell biology") || lowerTarget.includes("cell structure")) {
    const forbiddenChapterTerms = [
      "newton", "torque", "equilibrium", "vector quantity", "capacitance", "derivative of",
      "integral of", "cramer's rule", "molar mass", "projectile", "simple harmonic"
    ];
    for (const forbidden of forbiddenChapterTerms) {
      if (normalizedFullText.includes(forbidden)) return false;
    }
  }

  return true;
}

function repairAndParseJson(rawText: string): any[] {
  if (!rawText || typeof rawText !== "string") return [];
  const text = rawText.trim();

  // 1. Direct JSON.parse
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.questions)) return parsed.questions;
    if (parsed && typeof parsed === "object") return [parsed];
  } catch {}

  // 2. Strip Markdown code fences
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.questions)) return parsed.questions;
    if (parsed && typeof parsed === "object") return [parsed];
  } catch {}

  // 3. Extract outermost array slice
  const firstBracket = cleaned.indexOf("[");
  const lastBracket = cleaned.lastIndexOf("]");
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    const arraySlice = cleaned.substring(firstBracket, lastBracket + 1);
    try {
      const parsed = JSON.parse(arraySlice);
      if (Array.isArray(parsed)) return parsed;
    } catch {}

    // 4. Remove trailing commas before } or ]
    const noTrailingCommas = arraySlice.replace(/,\s*([\]\}])/g, "$1");
    try {
      const parsed = JSON.parse(noTrailingCommas);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }

  // 5. Regex extraction for individual JSON question objects
  const objectMatches = cleaned.match(/\{[\s\S]*?"q"[\s\S]*?"options"[\s\S]*?"correct"[\s\S]*?\}/g);
  if (objectMatches && objectMatches.length > 0) {
    const extractedObjects: any[] = [];
    for (const objStr of objectMatches) {
      try {
        const cleanObjStr = objStr.replace(/,\s*([\}])/g, "$1");
        const parsedObj = JSON.parse(cleanObjStr);
        if (parsedObj && (parsedObj.q || parsedObj.question)) {
          extractedObjects.push(parsedObj);
        }
      } catch {}
    }
    if (extractedObjects.length > 0) {
      return extractedObjects;
    }
  }

  return [];
}

// Cross-check and validation step for generated MCQs with strict duplicate prevention and topic filter
function validateAndFixQuestions(
  rawQuestions: any[],
  subject: string,
  topicLabel: string,
  difficulty: string,
  targetTopicName?: string
): MCQQuestion[] {
  if (!Array.isArray(rawQuestions)) return [];

  const validated: MCQQuestion[] = [];
  const canonSubject = normalizeSubjectKey(subject);
  const activeTopic = targetTopicName || topicLabel;

  // Sets to track seen stems and option signatures within this test batch
  const seenStems = new Set<string>();
  const seenOptionSigs = new Set<string>();

  const QUESTION_PLACEHOLDER_REGEX = /\b(lorem ipsum|placeholder|insert question|sample question|example question|type question|test question|n\/a|tbd|todo)\b/i;
  const OPTION_PLACEHOLDER_REGEX = /^(option\s*[a-d1-4]|choice\s*[a-d1-4]|placeholder|sample\s*option|lorem\s*ipsum|tbd|todo)$/i;

  for (let i = 0; i < rawQuestions.length; i++) {
    const item = rawQuestions[i];
    if (!item || typeof item !== "object") continue;

    // 1. Question stem validation
    let qText = typeof item.q === "string" ? item.q.trim() : "";
    if (!qText && typeof item.question === "string") qText = item.question.trim();
    if (!qText || qText.length < 8) continue;

    // Clean leading question numbers (e.g. "1. What is...", "Q2: ...")
    qText = qText.replace(/^(Q\d+[:\.]?|\d+[\.\)])\s*/i, "");

    // Check for placeholder text in question stem
    if (QUESTION_PLACEHOLDER_REGEX.test(qText)) continue;

    // Stem uniqueness check (ignore punctuation & casing)
    const normStem = qText.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]/g, "");
    if (seenStems.has(normStem)) {
      console.warn(`[MCQ Validation] Duplicate question stem rejected: "${qText}"`);
      continue;
    }

    // 1b. Anti-mismatch check: discard physics/math formulas when subject is Urdu/English/PakStudies/Islamiat
    const lowerQ = qText.toLowerCase();
    const isUrduOrIslamiat = canonSubject === "Urdu" || canonSubject === "Islamiat";
    const hasUrduScript = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(qText);

    if (isUrduOrIslamiat) {
      if (!hasUrduScript) {
        console.warn(`[MCQ Validation] Rejected non-Urdu question stem for ${subject}: "${qText}"`);
        continue;
      }
      if (
        lowerQ.includes("vector quantity") ||
        lowerQ.includes("classical mechanics") ||
        lowerQ.includes("newton") ||
        lowerQ.includes("harmonic motion") ||
        lowerQ.includes("magnetic flux") ||
        lowerQ.includes("capacitance") ||
        lowerQ.includes("derivative") ||
        lowerQ.includes("mitochondria") ||
        lowerQ.includes("physics") ||
        lowerQ.includes("chemistry") ||
        lowerQ.includes("torque") ||
        lowerQ.includes("velocity") ||
        lowerQ.includes("acceleration")
      ) {
        console.warn(`[MCQ Validation] Rejected science/physics question for ${subject}: "${qText}"`);
        continue;
      }
    } else if (["English", "Pakistan Studies"].includes(canonSubject)) {
      if (
        lowerQ.includes("vector quantity") ||
        lowerQ.includes("classical mechanics") ||
        lowerQ.includes("newton's") ||
        lowerQ.includes("harmonic motion") ||
        lowerQ.includes("magnetic flux") ||
        lowerQ.includes("capacitance") ||
        lowerQ.includes("derivative of") ||
        lowerQ.includes("mitochondria")
      ) {
        console.warn(`[MCQ Validation] Rejected cross-subject mismatched question for ${subject}: "${qText}"`);
        continue;
      }
    }

    // 2. Options array validation
    let rawOptions = item.options;
    if (!Array.isArray(rawOptions) || rawOptions.length < 4) continue;

    const cleanedOptions = rawOptions.slice(0, 4).map((opt: any) => {
      let str = typeof opt === "string" ? opt.trim() : String(opt || "").trim();
      // Remove leading choice labels like "A) ", "a. ", "1. ", "(A) ", etc.
      return str.replace(/^(\([A-Da-d1-4]\)|[A-Da-d1-4][\.\)]|\d+[\.\)])\s*/, "");
    });

    // Check that all 4 options are non-empty
    if (cleanedOptions.length !== 4) continue;
    if (cleanedOptions.some((opt) => !opt || opt.trim().length === 0)) continue;

    const OPTION_PLACEHOLDER_REGEX = /^(option\s*[a-d1-4]|choice\s*[a-d1-4]|placeholder|sample\s*option|lorem\s*ipsum|tbd|todo)$/i;
    const isBoilerplateOption = (text: string): boolean => {
      const lower = text.trim().toLowerCase();
      if (lower.length < 2) return true;
      if (OPTION_PLACEHOLDER_REGEX.test(lower)) return true;
      const fillerPhrases = [
        "primary rule of",
        "primary law of",
        "secondary principle of",
        "secondary principle",
        "standard rule of",
        "primary fundamental principle",
        "secondary empirical approximation",
        "inverse derivative constant",
        "unrelated systemic formula",
        "general scientific method",
        "concept 1",
        "concept 2",
        "concept 3",
        "concept 4"
      ];
      return fillerPhrases.some(phrase => lower.includes(phrase));
    };

    if (cleanedOptions.some(isBoilerplateOption)) {
      console.warn(`[MCQ Validation] Rejected question with filler/placeholder option text: "${qText}"`);
      continue;
    }

    // Ensure options are 100% distinct (exactly 4 unique options in this question)
    const uniqueOpts = new Set(cleanedOptions.map((o) => o.toLowerCase()));
    if (uniqueOpts.size < 4) {
      console.warn(`[MCQ Validation] Rejected question with non-unique option choices: "${qText}"`);
      continue;
    }

    // Check option set uniqueness across the test batch
    const optionSig = Array.from(uniqueOpts).sort().join("|");
    if (seenOptionSigs.has(optionSig)) {
      console.warn(`[MCQ Validation] Rejected question with duplicate option set: "${qText}"`);
      continue;
    }

    // 3. Correct answer index validation & robust alignment
    let correctIdx = -1;

    // Check if item.correct directly matches the text of an option
    if (item.correct !== undefined && item.correct !== null) {
      const itemCorrectStr = String(item.correct).trim().toLowerCase();
      const directMatchIdx = cleanedOptions.findIndex((opt) => opt.toLowerCase() === itemCorrectStr);
      if (directMatchIdx !== -1) {
        correctIdx = directMatchIdx;
      }
    }

    // Check letter representation
    if (correctIdx === -1 && typeof item.correct === "string") {
      const char = item.correct.trim().toUpperCase();
      if (char === "A" || char === "OPTION A" || char === "CHOICE A" || char === "0") correctIdx = 0;
      else if (char === "B" || char === "OPTION B" || char === "CHOICE B" || char === "1") correctIdx = 1;
      else if (char === "C" || char === "OPTION C" || char === "CHOICE C" || char === "2") correctIdx = 2;
      else if (char === "D" || char === "OPTION D" || char === "CHOICE D" || char === "3") correctIdx = 3;
    }

    // Check numeric representation
    if (correctIdx === -1) {
      const num = typeof item.correct === "number" ? item.correct : parseInt(String(item.correct), 10);
      if (!isNaN(num)) {
        if (num === 4) {
          correctIdx = 3; // 1-based index 4 = Option D
        } else if (num >= 0 && num <= 3) {
          correctIdx = num;
        }
      }
    }

    // 4. Explanation & Index Alignment Cross-check
    let explainText = typeof item.explain === "string" ? item.explain.trim() : "";
    if (!explainText && typeof item.explanation === "string") explainText = item.explanation.trim();

    if (explainText) {
      const expUpper = explainText.toUpperCase();
      const letterMatches: number[] = [];
      if (/\b(OPTION\s*A|CHOICE\s*A|\(A\))\b/.test(expUpper)) letterMatches.push(0);
      if (/\b(OPTION\s*B|CHOICE\s*B|\(B\))\b/.test(expUpper)) letterMatches.push(1);
      if (/\b(OPTION\s*C|CHOICE\s*C|\(C\))\b/.test(expUpper)) letterMatches.push(2);
      if (/\b(OPTION\s*D|CHOICE\s*D|\(D\))\b/.test(expUpper)) letterMatches.push(3);

      if (letterMatches.length === 1) {
        correctIdx = letterMatches[0];
      }
    }

    // 5. Strict Bounds Validation: correct index MUST be within bounds of options array [0..3]
    if (correctIdx < 0 || correctIdx >= cleanedOptions.length) {
      console.warn(`[MCQ Validation] Rejected question with unresolvable or out-of-bounds correct index (${item.correct}): "${qText}"`);
      continue;
    }

    if (!explainText) {
      explainText = `"${cleanedOptions[correctIdx]}" is the correct answer according to standard textbook principles.`;
    }

    // 6. Strict Topic Relevance Validation
    if (activeTopic) {
      const isTopicMatch = checkQuestionTopicRelevance(qText, item.topic, cleanedOptions, explainText, activeTopic, subject);
      if (!isTopicMatch) {
        console.warn(`[MCQ Validation] Rejected off-topic question for target topic "${activeTopic}": "${qText.slice(0, 80)}..." (Item topic: "${item.topic || 'None'}")`);
        continue;
      }
    }

    // Add to seen trackers
    seenStems.add(normStem);
    seenOptionSigs.add(optionSig);

    validated.push(shuffleQuestionOptions({
      id: `ai-q-${i + 1}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      q: qText,
      options: cleanedOptions,
      correct: correctIdx,
      topic: activeTopic || item.topic || subject,
      explain: explainText,
      difficulty: item.difficulty || difficulty,
    }));
  }

  return validated;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ limit: "25mb", extended: true }));

  app.get("/api/debug/logs", (req, res) => {
    let fileContent = "";
    try {
      if (fs.existsSync('/tmp/server_debug.log')) {
        fileContent = fs.readFileSync('/tmp/server_debug.log', 'utf8');
      }
    } catch (e) {}
    res.json({
      buffer: serverLogsBuffer,
      fileLogs: fileContent ? fileContent.split('\n') : []
    });
  });



  function generateSyllabusQuestions(
    subject: string,
    customTopic: string | undefined,
    questionCount: number,
    difficulty: string
  ): MCQQuestion[] {
    const topicLabel = customTopic || `${subject} Core Curriculum`;
    const questions: MCQQuestion[] = [];

    const bioPool = [
      {
        q: "Which structural component of the fluid mosaic plasma membrane is primarily responsible for maintaining membrane fluidity at lower temperatures?",
        options: ["Cholesterol molecules", "Glycoproteins", "Integral protein channels", "Phospholipid phosphate heads"],
        correct: 0,
        explain: "Cholesterol acts as a temperature buffer in animal cell membranes. At lower temperatures, it prevents phospholipids from packing tightly together, maintaining membrane fluidity."
      },
      {
        q: "In competitive enzyme inhibition, how are the Vmax (maximum reaction velocity) and Km (Michaelis constant) affected?",
        options: ["Vmax remains unchanged, Km increases", "Vmax decreases, Km remains unchanged", "Both Vmax and Km decrease", "Vmax increases, Km decreases"],
        correct: 0,
        explain: "In competitive inhibition, the inhibitor competes with substrate for the active site. Increasing substrate concentration overcomes inhibition, keeping Vmax constant, but requiring a higher substrate concentration to reach half-Vmax (hence Km increases)."
      },
      {
        q: "During non-cyclic photophosphorylation in light reactions of photosynthesis, what is the ultimate electron donor and terminal electron acceptor?",
        options: ["Water is the ultimate donor; NADP+ is the terminal acceptor", "ATP is the ultimate donor; NADPH is the terminal acceptor", "Photosystem I is donor; Photosystem II is acceptor", "Carbon dioxide is donor; Glucose is acceptor"],
        correct: 0,
        explain: "Water undergoes photolysis at Photosystem II to release electrons, which pass through electron transport chains to reduce NADP+ into NADPH."
      },
      {
        q: "Which phase of human cardiac cycle involves closure of the semilunar valves, producing the second heart sound ('dub')?",
        options: ["Ventricular Isovolumetric Relaxation", "Ventricular Systole", "Atrial Systole", "Isovolumetric Contraction"],
        correct: 0,
        explain: "The second heart sound ('dub') is caused by the sudden closure of the aortic and pulmonary semilunar valves at the beginning of ventricular diastole."
      },
      {
        q: "During nerve impulse transmission, what triggers the exocytosis of neurotransmitter vesicles into the synaptic cleft?",
        options: ["Influx of Ca2+ ions into the presynaptic terminal", "Efflux of K+ ions from the postsynaptic neuron", "Influx of Na+ ions into the synaptic knob", "Active transport of Cl- ions"],
        correct: 0,
        explain: "When an action potential arrives at the presynaptic axon terminal, voltage-gated calcium channels open, causing Ca2+ influx which initiates neurotransmitter vesicle fusion and exocytosis."
      },
      {
        q: "In human females, at which stage of meiosis are primary oocytes arrested until puberty?",
        options: ["Prophase I (Diplotene stage)", "Metaphase II", "Anaphase I", "Telophase II"],
        correct: 0,
        explain: "Primary oocytes undergo meiosis I before birth but remain suspended at Prophase I (diplotene stage) until LH surge during puberty."
      },
      {
        q: "If a man with blood group A (heterozygous) marries a woman with blood group B (heterozygous), what is the probability of their offspring having blood group O?",
        options: ["25% (1/4)", "50% (1/2)", "75% (3/4)", "0%"],
        correct: 0,
        explain: "Heterozygous Group A (IA i) x Heterozygous Group B (IB i) yields IAIB, IAi, IBi, and ii (O). Thus 1 in 4 (25%) will have blood group O."
      },
      {
        q: "Which sliding filament protein binds calcium ions to uncover the myosin-binding sites on actin filaments during skeletal muscle contraction?",
        options: ["Troponin C", "Tropomyosin", "Myosin light chain", "Titine"],
        correct: 0,
        explain: "Calcium released from the sarcoplasmic reticulum binds to Troponin C, inducing a shift in tropomyosin to expose actin active sites."
      },
      {
        q: "Which organelle is known as the powerhouse of the eukaryotic cell?",
        options: ["Mitochondria", "Ribosome", "Golgi Apparatus", "Endoplasmic Reticulum"],
        correct: 0,
        explain: "Mitochondria produce ATP through oxidative phosphorylation during cellular respiration."
      },
      {
        q: "During photosynthesis, light-independent reactions (Calvin cycle) occur in the:",
        options: ["Stroma of chloroplast", "Thylakoid membrane", "Mitochondrial matrix", "Cytosol"],
        correct: 0,
        explain: "The Calvin cycle takes place in the fluid-filled stroma of the chloroplast where enzymes like RuBisCO reside."
      }
    ];

    const chemPool = [
      {
        q: "Which of the following orbitals has the lowest energy according to the (n + l) rule?",
        options: ["4s orbital", "3d orbital", "4p orbital", "5s orbital"],
        correct: 0,
        explain: "For 4s: n+l = 4+0 = 4. For 3d: n+l = 3+2 = 5. Lower (n+l) value means lower energy according to Aufbau principle."
      },
      {
        q: "The geometry of a water molecule (H₂O) according to VSEPR theory is:",
        options: ["Bent / Angular", "Linear", "Tetrahedral", "Trigonal Planar"],
        correct: 0,
        explain: "H₂O has 2 bonding pairs and 2 lone pairs on Oxygen, leading to a bent shape with bond angle ~104.5°."
      },
      {
        q: "Which of the following compounds exhibits optical isomerism?",
        options: ["2-chlorobutane", "1-chlorobutane", "2-chloropropane", "Ethanol"],
        correct: 0,
        explain: "2-chlorobutane has a chiral carbon attached to 4 different groups (-H, -Cl, -CH₃, -C₂H₅), making it optically active."
      },
      {
        q: "The pH of a 0.001 M HCl solution at 25°C is:",
        options: ["3.0", "1.0", "7.0", "11.0"],
        correct: 0,
        explain: "pH = -log[H⁺] = -log(10⁻³) = 3.0."
      },
      {
        q: "What is the correct order of decreasing SN1 reaction reactivity for alkyl halides?",
        options: [
          "3° Alkyl Halide > 2° Alkyl Halide > 1° Alkyl Halide > Methyl Halide",
          "1° Alkyl Halide > 2° Alkyl Halide > 3° Alkyl Halide",
          "Methyl Halide > 1° > 2° > 3°",
          "2° Alkyl Halide > 3° Alkyl Halide > 1° Alkyl Halide"
        ],
        correct: 0,
        explain: "SN1 reactions proceed via a carbocation intermediate. Tertiary (3°) carbocations are stabilized by hyperconjugation and inductive effects."
      },
      {
        q: "According to Le Chatelier's Principle, increasing total pressure on N₂ (g) + 3H₂ (g) ⇌ 2NH₃ (g) will:",
        options: [
          "Shift equilibrium to the right (towards NH₃ formation)",
          "Shift equilibrium to the left",
          "Have no effect on equilibrium position",
          "Decompose ammonia completely"
        ],
        correct: 0,
        explain: "Increasing pressure shifts equilibrium toward the side with fewer gas moles (2 moles of NH3 vs 4 moles of reactants)."
      },
      {
        q: "Which transition metal ion exhibits a d5 electron configuration in its ground state?",
        options: ["Fe3+", "Mn4+", "Cr2+", "Cu2+"],
        correct: 0,
        explain: "Iron (Fe) has Z=26 ([Ar] 4s² 3d⁶). Losing 3 electrons (two from 4s and one from 3d) leaves Fe3+ with a stable half-filled d5 configuration."
      }
    ];

    const physPool = [
      {
        q: "Which of the following physical quantities is a vector quantity in classical mechanics?",
        options: ["Torque", "Electric Potential", "Work Done", "Kinetic Energy"],
        correct: 0,
        explain: "Torque is defined as τ = r × F, which is a cross product resulting in a vector quantity with both magnitude and direction."
      },
      {
        q: "According to Newton's Second Law of Motion, the rate of change of momentum is equal to:",
        options: ["Applied Net Force", "Mass x Velocity", "Impulse per unit mass", "Total Energy"],
        correct: 0,
        explain: "F_net = dp/dt. The rate of change of linear momentum of a body is directly proportional to the net applied force."
      },
      {
        q: "In a simple harmonic motion (SHM), the acceleration of the particle is maximum at:",
        options: ["Extreme positions", "Mean position", "Halfway between mean and extreme", "It remains constant"],
        correct: 0,
        explain: "Since a = -ω²x, acceleration is directly proportional to displacement x. Thus, 'a' is maximum at extreme positions where x = A."
      },
      {
        q: "The SI unit of magnetic flux density (B) is:",
        options: ["Tesla (T)", "Weber (Wb)", "Gauss", "Henry (H)"],
        correct: 0,
        explain: "Magnetic flux density B = Φ/A, measured in Webers per square meter, which is defined as Tesla (T)."
      },
      {
        q: "What happens to the capacitance of a parallel plate capacitor when a dielectric material is inserted between the plates?",
        options: ["Increases by factor of k", "Decreases by factor of k", "Remains unchanged", "Becomes zero"],
        correct: 0,
        explain: "Inserting a dielectric of constant k increases capacitance C = k * C₀ because permittivity of the medium increases."
      },
      {
        q: "The maximum kinetic energy of photoelectrons emitted in photoelectric effect depends strictly on:",
        options: ["Frequency of incident light", "Intensity of incident light", "Time of exposure", "Area of metal target"],
        correct: 0,
        explain: "According to Einstein's photoelectric equation KE_max = hf - Φ, maximum kinetic energy depends linearly on light frequency f, independent of intensity."
      },
      {
        q: "In an ideal step-up transformer, which quantity remains unchanged between primary and secondary coils?",
        options: ["Electrical power (P)", "Voltage (V)", "Current (I)", "Magnetic flux density"],
        correct: 0,
        explain: "In an ideal transformer with zero energy loss, input power equals output power: P_primary = P_secondary."
      }
    ];

    const mathPool = [
      {
        q: "What is the derivative of f(x) = e^(2x) * sin(x) with respect to x?",
        options: [
          "e^(2x) [2 sin(x) + cos(x)]",
          "2 e^(2x) cos(x)",
          "e^(2x) [sin(x) + 2 cos(x)]",
          "2 e^(2x) sin(x)"
        ],
        correct: 0,
        explain: "Using the product rule d/dx[u*v] = u'v + uv': f'(x) = 2e^(2x)sin(x) + e^(2x)cos(x) = e^(2x)[2sin(x) + cos(x)]."
      },
      {
        q: "The radius of the circle given by x² + y² - 6x + 8y = 0 is:",
        options: ["5", "25", "10", "7"],
        correct: 0,
        explain: "Compare with x²+y²+2gx+2fy+c=0: g=-3, f=4, c=0. Radius r = √(g²+f²-c) = √(9+16-0) = √25 = 5."
      },
      {
        q: "The value of the definite integral ∫₀¹ x³ dx is:",
        options: ["1/4", "1/3", "1/2", "1"],
        correct: 0,
        explain: "∫ x³ dx = [x⁴ / 4] from 0 to 1 = (1⁴/4) - (0⁴/4) = 1/4."
      },
      {
        q: "If A is a square matrix of order 3 with determinant |A| = 4, then the determinant of 2A is:",
        options: ["32", "8", "16", "64"],
        correct: 0,
        explain: "For an n×n matrix, |kA| = k^n * |A|. For n=3 and k=2: |2A| = 2^3 * 4 = 8 * 4 = 32."
      }
    ];

    const csPool = [
      {
        q: "Which linear data structure operates on a First-In, First-Out (FIFO) basis?",
        options: ["Queue", "Stack", "Binary Search Tree", "Graph"],
        correct: 0,
        explain: "Queues insert elements at the rear and process them from the front in strict FIFO order."
      },
      {
        q: "In Object-Oriented Programming (OOP), deriving a new class from an existing class is termed:",
        options: ["Inheritance", "Encapsulation", "Polymorphism", "Abstraction"],
        correct: 0,
        explain: "Inheritance enables a derived child class to inherit fields and methods from a parent base class."
      },
      {
        q: "Which SQL command is used to permanently remove a database table structure and all its data?",
        options: ["DROP TABLE", "DELETE TABLE", "TRUNCATE TABLE", "REMOVE TABLE"],
        correct: 0,
        explain: "DROP TABLE completely deletes the table definition as well as all contained database rows."
      }
    ];

    const engPool = [
      {
        q: "Select the correctly punctuated and grammatically sound sentence:",
        options: [
          "It's a great day for an exam.",
          "Its a great day for an exam.",
          "Its' a great day for an exam.",
          "It is a great day, for an exam"
        ],
        correct: 0,
        explain: "\"It's\" is the proper apostrophe contraction for 'It is'. 'Its' without apostrophe is possessive."
      },
      {
        q: "Choose the word most nearly OPPOSITE in meaning to 'BENEVOLENT':",
        options: ["Malevolent", "Magnanimous", "Charitable", "Altruistic"],
        correct: 0,
        explain: "Benevolent (wishing well) is the direct antonym of Malevolent (wishing harm)."
      },
      {
        q: "Identify the subject-verb agreement error correction: 'Neither of the applicants _____ qualified for the post.'",
        options: ["is", "are", "were", "have been"],
        correct: 0,
        explain: "Indefinite pronouns like 'neither', 'either', and 'each' take singular verbs: 'Neither is qualified'."
      }
    ];

    const lrPool = [
      {
        q: "If ALL Doctors are Scholars, and SOME Scholars are Authors, which conclusion logically follows?",
        options: [
          "Some Scholars are Doctors",
          "All Authors are Doctors",
          "No Doctor is an Author",
          "All Scholars are Doctors"
        ],
        correct: 0,
        explain: "If all Doctors are Scholars, the subset of Scholars must contain Doctors; hence 'Some Scholars are Doctors' is valid."
      },
      {
        q: "If 'STETHOSCOPE' is coded as 'TUFUIFTPDQF' in a secret cipher, how is 'DOCTOR' coded in that same pattern?",
        options: ["EPDUPS", "CNDSNP", "EQEVPS", "DPDUOS"],
        correct: 0,
        explain: "Each letter is shifted forward by 1 (+1 in alphabet): D->E, O->P, C->D, T->U, O->P, R->S. Output: EPDUPS."
      },
      {
        q: "Complete the numerical series: 3, 7, 15, 31, 63, ?",
        options: ["127", "125", "128", "95"],
        correct: 0,
        explain: "Pattern: Multiply by 2 and add 1 (x * 2 + 1). (63 * 2) + 1 = 127."
      }
    ];

    const urduPool = [
      {
        q: "اسم نکرہ کی نشاندہی کریں:",
        options: ["شاعر", "لاہور", "علامہ اقبال", "قرآن مجید"],
        correct: 0,
        explain: "'شاعر' ایک عام اسم (اسم نکرہ) ہے جبکہ لاہور اور علامہ اقبال اسم معرفہ ہیں۔"
      },
      {
        q: "'آب آب ہونا' محاورے کا صحیح مفہوم کیا ہے؟",
        options: ["بہت شرمندہ ہونا", "پانی پینا", "نہانا", "غصہ ہونا"],
        correct: 0,
        explain: "'آب آب ہونا' کا مطلب شدید شرمندگی اور ندامت محسوس کرنا ہے۔"
      },
      {
        q: "اردو زبان کے پہلے صاحبِ دیوان شاعر کون ہیں؟",
        options: ["سلطان قلی قطب شاہ", "میر تقی میر", "مرزا اسد اللہ خان غالب", "خواجہ میر درد"],
        correct: 0,
        explain: "سلطان قلی قطب شاہ اردو زبان کے پہلے صاحبِ دیوان شاعر تسلیم کیے جاتے ہیں۔"
      },
      {
        q: "علامہ محمد اقبال کا پہلا اردو شعری مجموعہ کون سا ہے؟",
        options: ["بانگِ درا", "بالِ جبریل", "ضربِ کلیم", "ارمغانِ حجاز"],
        correct: 0,
        explain: "علامہ اقبال کا پہلا اردو شعری مجموعہ 'بانگِ درا' ہے جو 1924ء میں شائع ہوا تھا۔"
      },
      {
        q: "غزل کے آخری شعر کو کیا کہتے ہیں جس میں شاعر اپنا تخلص استعمال کرتا ہے؟",
        options: ["مقطع", "مطلع", "حسنِ مطلع", "بیت الغزل"],
        correct: 0,
        explain: "غزل کے آخری شعر کو مقطع کہتے ہیں بشرطیکہ اس میں شاعر کا تخلص موجود ہو۔"
      }
    ];

    const pakStudiesPool = [
      {
        q: "The Lahore Resolution was passed on March 23 in which year?",
        options: ["1940", "1930", "1937", "1947"],
        correct: 0,
        explain: "The historic Pakistan Resolution presented by A.K. Fazlul Huq was adopted on March 23, 1940 at Lahore."
      },
      {
        q: "The highest mountain peak in Pakistan is:",
        options: ["K2 (Godwin-Austen)", "Nanga Parbat", "Broad Peak", "Rakaposhi"],
        correct: 0,
        explain: "K2, situated in the Karakoram range, is Pakistan's highest peak (8,611m)."
      }
    ];

    const islamiatPool = [
      {
        q: "قرآن مجید کی کس سورۃ کو 'قلب القرآن' (قرآن کا دل) کہا جاتا ہے؟",
        options: ["سورۃ یٰسین", "سورۃ الفاتحہ", "سورۃ البقرہ", "سورۃ الرحمن"],
        correct: 0,
        explain: "احادیث مبارکہ کی روشنی میں سورۃ یٰسین کو قرآن مجید کا دل کہا گیا ہے۔"
      },
      {
        q: "صلح حدیبیہ کس ہجری میں وقوع پذیر ہوا؟",
        options: ["6 ہجری", "2 ہجری", "8 ہجری", "10 ہجری"],
        correct: 0,
        explain: "صلح حدیبیہ 6 ہجری میں نبی کریم ﷺ اور قریشِ مکہ کے درمیان طے پایا تھا۔"
      },
      {
        q: "اسلام کے پہلے خلیفہ راشد کون ہیں؟",
        options: ["حضرت ابو بکر صدیق رضی اللہ عنہ", "حضرت عمر فاروق رضی اللہ عنہ", "حضرت عثمان غنی رضی اللہ عنہ", "حضرت علی مرتضیٰ رضی اللہ عنہ"],
        correct: 0,
        explain: "نبی کریم ﷺ کے وصال کے بعد حضرت ابو بکر صدیق رضی اللہ عنہ پہلے خلیفہ راشد منتخب ہوئے۔"
      }
    ];

    const keySubject = normalizeSubjectKey(subject);
    const lowerSub = subject.toLowerCase();
    
    let activePool: Array<{ q: string; options: string[]; correct: number; explain: string }> = [];

    if (lowerSub.includes("mdcat") || lowerSub.includes("full mock")) {
      // Balance MDCAT mock test with real items across Bio, Chem, Phys, Eng, LR
      activePool = [...bioPool, ...chemPool, ...physPool, ...engPool, ...lrPool];
    } else if (lowerSub.includes("tcat")) {
      activePool = [...mathPool, ...physPool, ...chemPool, ...csPool, ...engPool, ...lrPool];
    } else if (keySubject === "Biology") {
      activePool = bioPool;
    } else if (keySubject === "Chemistry") {
      activePool = chemPool;
    } else if (keySubject === "Physics") {
      activePool = physPool;
    } else if (keySubject === "Mathematics") {
      activePool = mathPool;
    } else if (keySubject === "Computer Science") {
      activePool = csPool;
    } else if (keySubject === "English") {
      activePool = engPool;
    } else if (keySubject === "Logical Reasoning") {
      activePool = lrPool;
    } else if (keySubject === "Urdu") {
      activePool = urduPool;
    } else if (keySubject === "Pakistan Studies") {
      activePool = pakStudiesPool;
    } else if (keySubject === "Islamiat") {
      activePool = islamiatPool;
    } else {
      activePool = [...bioPool, ...chemPool, ...physPool];
    }

    if (customTopic && customTopic !== `${subject} Core Curriculum` && customTopic !== `${subject} Syllabus` && customTopic !== "All Topics") {
      const filteredPool = activePool.filter(t => checkQuestionTopicRelevance(t.q, undefined, t.options, t.explain, customTopic, subject));
      if (filteredPool.length > 0) {
        activePool = filteredPool;
      }
    }

    for (let i = 0; i < questionCount; i++) {
      const template = activePool[i % activePool.length];
      questions.push(shuffleQuestionOptions({
        id: `real-q-${i + 1}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        q: template.q,
        options: [...template.options],
        correct: template.correct,
        topic: customTopic || topicLabel,
        explain: template.explain,
        difficulty
      }));
    }

    return questions;
  }

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "SHS Virtual Academy MCQs Generator API" });
  });

  // ========================================================
  // STRUCTURED MCQ BANK API ENDPOINTS (MDCAT & ECAT)
  // Hierarchy: Subtopic -> Chapter -> Full Subject Mock
  // ========================================================

  // Helper to load / save local structured MCQs file fallback
  const STRUCTURED_MCQS_FILE = path.join(process.cwd(), 'data', 'structured_mcqs.json');

  function loadLocalMcqs(): any[] {
    try {
      if (fs.existsSync(STRUCTURED_MCQS_FILE)) {
        const raw = fs.readFileSync(STRUCTURED_MCQS_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error("Error reading local structured_mcqs.json:", e);
    }
    return [];
  }

  function saveLocalMcqs(mcqsList: any[]) {
    try {
      const dir = path.dirname(STRUCTURED_MCQS_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(STRUCTURED_MCQS_FILE, JSON.stringify(mcqsList, null, 2), 'utf-8');
    } catch (e) {
      console.error("Error saving local structured_mcqs.json:", e);
    }
  }

  // 1. Batch insert endpoint (Inserts 100 MCQs per subtopic with count confirmation)
  app.post("/api/mcqs/batch-insert", async (req, res) => {
    try {
      const { exam_type, subject, chapter, subtopic, mcqs } = req.body || {};
      if (!exam_type || !subject || !chapter || !subtopic || !Array.isArray(mcqs) || mcqs.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: exam_type, subject, chapter, subtopic, and mcqs array are required."
        });
      }

      const normExam = String(exam_type).trim().toUpperCase();
      const normSubj = normalizeSubjectKey(subject);
      const normChap = String(chapter).trim();
      const normSubt = String(subtopic).trim();

      const rowsToInsert = mcqs.map((m: any, idx: number) => ({
        id: m.id || `${normExam}-${normSubj}-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
        exam_type: normExam,
        subject: normSubj,
        chapter: normChap,
        subtopic: normSubt,
        question_text: String(m.question_text || m.q || '').trim(),
        options: Array.isArray(m.options) ? m.options : [],
        correct_option: typeof m.correct_option === 'number' ? m.correct_option : Number(m.correct ?? 0),
        explanation: String(m.explanation || m.explain || '').trim(),
        difficulty: String(m.difficulty || 'Medium').trim(),
        needs_review: Boolean(m.needs_review),
        created_at: new Date().toISOString()
      }));

      // Always save to local JSON file store first
      const existingLocal = loadLocalMcqs();
      // Remove any previous entries for this exact subtopic if re-inserting
      const filteredLocal = existingLocal.filter(
        item => !(item.exam_type === normExam && item.subject === normSubj && item.chapter === normChap && item.subtopic === normSubt)
      );
      const updatedLocal = [...filteredLocal, ...rowsToInsert];
      saveLocalMcqs(updatedLocal);

      // Attempt Supabase insert if DB available
      const db = getSupabaseAdminClient() || supabaseServer;
      let dbInsertedCount = 0;

      if (db) {
        let { data, error } = await db
          .from('mcqs')
          .insert(rowsToInsert)
          .select('id');

        if (error && error.message && error.message.includes('needs_review')) {
          console.warn("needs_review column missing in Supabase, inserting without needs_review column...");
          const rowsToInsertNoReview = rowsToInsert.map(({ needs_review, ...rest }: any) => rest);
          const retryRes = await db.from('mcqs').insert(rowsToInsertNoReview).select('id');
          data = retryRes.data;
          error = retryRes.error;
        }

        if (!error && data) {
          dbInsertedCount = data.length;
        } else if (error) {
          console.warn("[/api/mcqs/batch-insert Supabase warning]:", error.message);
        }
      }

      const finalCount = dbInsertedCount > 0 ? dbInsertedCount : rowsToInsert.length;
      console.log(`[/api/mcqs/batch-insert success]: Saved ${finalCount} MCQs for ${normExam} -> ${normSubj} -> ${normChap} -> ${normSubt}`);

      return res.json({
        success: true,
        exam_type: normExam,
        subject: normSubj,
        chapter: normChap,
        subtopic: normSubt,
        inserted_count: finalCount,
        storage: dbInsertedCount > 0 ? 'supabase+local' : 'local_file'
      });
    } catch (err: any) {
      console.error("[/api/mcqs/batch-insert exception]:", err);
      return res.status(500).json({ success: false, error: err?.message || "Failed batch insert" });
    }
  });

  // 2. Retrieval Endpoint - Subtopic-Specific Only (Strictly exam_type + subject + chapter + subtopic)
  app.get("/api/mcqs/subtopic", async (req, res) => {
    try {
      const exam_type = String(req.query.exam_type || '').trim().toUpperCase();
      const subject = normalizeSubjectKey(String(req.query.subject || '').trim());
      const chapter = String(req.query.chapter || '').trim();
      const subtopic = String(req.query.subtopic || '').trim();
      const student_id = req.query.student_id ? String(req.query.student_id).trim() : null;
      const limit = Math.min(Number(req.query.limit || 100), 200);

      if (!exam_type || !subject || !chapter || !subtopic) {
        return res.status(400).json({
          success: false,
          error: "Required parameters: exam_type, subject, chapter, subtopic"
        });
      }

      const db = getSupabaseAdminClient() || supabaseServer;
      let excludedIds: string[] = [];

      if (db && student_id) {
        try {
          const { data: attempts } = await db
            .from('student_attempted_mcqs')
            .select('mcq_id')
            .eq('student_id', student_id)
            .eq('exam_type', exam_type)
            .eq('subject', subject)
            .gte('attempted_at', new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString());
          if (Array.isArray(attempts)) {
            excludedIds = attempts.map(a => a.mcq_id).filter(Boolean);
          }
        } catch (e) {
          console.warn("Could not fetch student attempted mcqs:", e);
        }
      }

      // 1. Try Supabase first
      if (db) {
        let query = db
          .from('mcqs')
          .select('*')
          .eq('exam_type', exam_type)
          .eq('subject', subject)
          .eq('chapter', chapter)
          .eq('subtopic', subtopic);

        if (excludedIds.length > 0) {
          query = query.not('id', 'in', `(${excludedIds.slice(0, 100).join(',')})`);
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data) && data.length > 0) {
          const shuffled = [...data].sort(() => Math.random() - 0.5).slice(0, limit);
          return res.json({
            success: true,
            filter: { exam_type, subject, chapter, subtopic },
            count: shuffled.length,
            questions: shuffled,
            source: 'supabase'
          });
        }
      }

      // 2. Fallback to local JSON store
      const allLocal = loadLocalMcqs();
      let matched = allLocal.filter(
        item => item.exam_type === exam_type && item.subject === subject && item.chapter === chapter && item.subtopic === subtopic
      );

      if (excludedIds.length > 0) {
        matched = matched.filter(item => !excludedIds.includes(item.id));
      }

      const shuffled = [...matched].sort(() => Math.random() - 0.5).slice(0, limit);
      return res.json({
        success: true,
        filter: { exam_type, subject, chapter, subtopic },
        count: shuffled.length,
        questions: shuffled,
        source: 'local_file'
      });
    } catch (err: any) {
      console.error("[/api/mcqs/subtopic error]:", err);
      return res.status(500).json({ success: false, error: err?.message || "Subtopic query failed" });
    }
  });

  // 3. Retrieval Endpoint - Chapter Test (Union of all subtopics under exam_type + subject + chapter)
  app.get("/api/mcqs/chapter", async (req, res) => {
    try {
      const exam_type = String(req.query.exam_type || '').trim().toUpperCase();
      const subject = normalizeSubjectKey(String(req.query.subject || '').trim());
      const chapter = String(req.query.chapter || '').trim();
      const student_id = req.query.student_id ? String(req.query.student_id).trim() : null;
      const limit = Math.min(Number(req.query.limit || 30), 100);

      if (!exam_type || !subject || !chapter) {
        return res.status(400).json({
          success: false,
          error: "Required parameters: exam_type, subject, chapter"
        });
      }

      const db = getSupabaseAdminClient() || supabaseServer;
      let excludedIds: string[] = [];

      if (db && student_id) {
        try {
          const { data: attempts } = await db
            .from('student_attempted_mcqs')
            .select('mcq_id')
            .eq('student_id', student_id)
            .eq('exam_type', exam_type)
            .eq('subject', subject)
            .gte('attempted_at', new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString());
          if (Array.isArray(attempts)) {
            excludedIds = attempts.map(a => a.mcq_id).filter(Boolean);
          }
        } catch (e) {
          console.warn("Could not fetch student attempted mcqs:", e);
        }
      }

      if (db) {
        let query = db
          .from('mcqs')
          .select('*')
          .eq('exam_type', exam_type)
          .eq('subject', subject)
          .eq('chapter', chapter);

        if (excludedIds.length > 0) {
          query = query.not('id', 'in', `(${excludedIds.slice(0, 100).join(',')})`);
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data) && data.length > 0) {
          const shuffled = [...data].sort(() => Math.random() - 0.5).slice(0, limit);
          return res.json({
            success: true,
            filter: { exam_type, subject, chapter },
            count: shuffled.length,
            questions: shuffled,
            source: 'supabase'
          });
        }
      }

      // Local fallback
      const allLocal = loadLocalMcqs();
      let matched = allLocal.filter(
        item => item.exam_type === exam_type && item.subject === subject && item.chapter === chapter
      );

      if (excludedIds.length > 0) {
        matched = matched.filter(item => !excludedIds.includes(item.id));
      }

      const shuffled = [...matched].sort(() => Math.random() - 0.5).slice(0, limit);
      return res.json({
        success: true,
        filter: { exam_type, subject, chapter },
        count: shuffled.length,
        questions: shuffled,
        source: 'local_file'
      });
    } catch (err: any) {
      console.error("[/api/mcqs/chapter error]:", err);
      return res.status(500).json({ success: false, error: err?.message || "Chapter query failed" });
    }
  });

  // 4. Retrieval Endpoint - Full Subject Mock Test (Union of all chapters in that subject)
  app.get("/api/mcqs/mock", async (req, res) => {
    try {
      const exam_type = String(req.query.exam_type || '').trim().toUpperCase();
      const subject = normalizeSubjectKey(String(req.query.subject || '').trim());
      const student_id = req.query.student_id ? String(req.query.student_id).trim() : null;
      const defaultLimit = exam_type === 'MDCAT' ? 180 : 100;
      const limit = Math.min(Number(req.query.limit || defaultLimit), 200);

      if (!exam_type || !subject) {
        return res.status(400).json({
          success: false,
          error: "Required parameters: exam_type, subject"
        });
      }

      const db = getSupabaseAdminClient() || supabaseServer;
      let excludedIds: string[] = [];

      if (db && student_id) {
        try {
          const { data: attempts } = await db
            .from('student_attempted_mcqs')
            .select('mcq_id')
            .eq('student_id', student_id)
            .eq('exam_type', exam_type)
            .eq('subject', subject)
            .gte('attempted_at', new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString());
          if (Array.isArray(attempts)) {
            excludedIds = attempts.map(a => a.mcq_id).filter(Boolean);
          }
        } catch (e) {
          console.warn("Could not fetch student attempted mcqs:", e);
        }
      }

      if (db) {
        let query = db
          .from('mcqs')
          .select('*')
          .eq('exam_type', exam_type)
          .eq('subject', subject);

        if (excludedIds.length > 0) {
          query = query.not('id', 'in', `(${excludedIds.slice(0, 100).join(',')})`);
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data) && data.length > 0) {
          const shuffled = [...data].sort(() => Math.random() - 0.5).slice(0, limit);
          return res.json({
            success: true,
            filter: { exam_type, subject },
            count: shuffled.length,
            questions: shuffled,
            source: 'supabase'
          });
        }
      }

      // Local fallback
      const allLocal = loadLocalMcqs();
      let matched = allLocal.filter(
        item => item.exam_type === exam_type && item.subject === subject
      );

      if (excludedIds.length > 0) {
        matched = matched.filter(item => !excludedIds.includes(item.id));
      }

      const shuffled = [...matched].sort(() => Math.random() - 0.5).slice(0, limit);
      return res.json({
        success: true,
        filter: { exam_type, subject },
        count: shuffled.length,
        questions: shuffled,
        source: 'local_file'
      });
    } catch (err: any) {
      console.error("[/api/mcqs/mock error]:", err);
      return res.status(500).json({ success: false, error: err?.message || "Mock query failed" });
    }
  });

  // 5. Track Attempted Questions (No duplicate / repeat logic)
  app.post("/api/mcqs/record-attempt", async (req, res) => {
    try {
      const { student_id, mcq_ids, exam_type, subject } = req.body || {};
      if (!student_id || !Array.isArray(mcq_ids) || mcq_ids.length === 0 || !exam_type || !subject) {
        return res.status(400).json({ success: false, error: "Missing required fields" });
      }

      const db = getSupabaseAdminClient() || supabaseServer;
      if (db) {
        const rows = mcq_ids.map((id: string) => ({
          student_id,
          mcq_id: id,
          exam_type: String(exam_type).trim().toUpperCase(),
          subject: normalizeSubjectKey(subject),
          attempted_at: new Date().toISOString()
        }));

        await db.from('student_attempted_mcqs').insert(rows);
      }

      return res.json({ success: true, recorded_count: mcq_ids.length });
    } catch (err: any) {
      console.error("[/api/mcqs/record-attempt error]:", err);
      return res.status(500).json({ success: false, error: err?.message || "Failed to record attempts" });
    }
  });

  // API Endpoint: Verify current Auth session server-side
  app.get("/api/verify-auth", async (req, res) => {
    const { user, isAdmin } = await verifyAuthToken(req);
    if (!user) {
      return res.status(401).json({ success: false, authenticated: false, error: "Unauthenticated session" });
    }
    return res.json({
      success: true,
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        isAdmin,
      },
    });
  });

  // API Endpoint: Query current test usage for a student
  app.get("/api/mcq-usage", async (req, res) => {
    const { user, isAdmin: verifiedAdmin } = await verifyAuthToken(req);
    const userId = user ? user.id : String(req.query.userId || "guest");
    const userEmail = user ? user.email : (req.query.userEmail ? String(req.query.userEmail) : undefined);
    const isAdmin = verifiedAdmin || isAdminEmail(userEmail);

    const isPro = isAdmin ? true : await checkStudentIsPro(userId, userEmail);

    const currentUsage = isAdmin ? 0 : await getStudentMonthlyTestCount(userId, userEmail, req);
    const resetDateStr = getNextMonthResetDate();
    const limit = isPro ? 999999 : 2;
    const remaining = isPro ? 999999 : Math.max(0, 2 - currentUsage);

    res.json({
      success: true,
      currentUsage,
      limit,
      remaining,
      resetDate: resetDateStr,
      isAdmin,
      isPro,
    });
  });

  // API Endpoint: Server-side check if student can start a new test
  app.post("/api/check-test-limit", async (req, res) => {
    try {
      const { userId, userEmail } = req.body;
      const { user, isAdmin: verifiedAdmin } = await verifyAuthToken(req);
      const activeUserId = user ? user.id : String(userId || "guest");
      const activeEmail = user ? user.email : (userEmail || undefined);
      const isAdmin = verifiedAdmin || isAdminEmail(activeEmail);

      const isPro = isAdmin ? true : await checkStudentIsPro(activeUserId, activeEmail);
      const resetDateStr = getNextMonthResetDate();

      if (isAdmin || isPro) {
        return res.json({
          success: true,
          allowed: true,
          isPro: true,
          currentUsage: 0,
          limit: 999999,
          remaining: 999999,
          resetDate: resetDateStr,
        });
      }

      // If unauthenticated guest without email, advise authentication
      if (activeUserId === "guest" && !activeEmail) {
        return res.json({
          success: true,
          allowed: false,
          requiresAuth: true,
          message: "Please sign in or create a free account to take practice tests.",
          currentUsage: 0,
          limit: 2,
          remaining: 2,
          resetDate: resetDateStr,
        });
      }

      const testsTaken = await getStudentMonthlyTestCount(activeUserId, activeEmail, req);
      if (testsTaken >= 2) {
        const msg = `You've used your 2 free tests this month — upgrade to continue. Limit resets on ${resetDateStr}.`;
        return res.status(403).json({
          success: false,
          allowed: false,
          limitExceeded: true,
          error: msg,
          message: msg,
          currentUsage: testsTaken,
          limit: 2,
          remaining: 0,
          resetDate: resetDateStr,
        });
      }

      return res.json({
        success: true,
        allowed: true,
        currentUsage: testsTaken,
        limit: 2,
        remaining: Math.max(0, 2 - testsTaken),
        resetDate: resetDateStr,
      });
    } catch (err: any) {
      console.error("[/api/check-test-limit error]:", err);
      return res.status(500).json({ success: false, error: err?.message || "Failed to check test limit" });
    }
  });

  // API Endpoint: Register test start attempt server-side
  app.post("/api/record-test-start", async (req, res) => {
    try {
      const { userId, userEmail } = req.body;
      const { user, isAdmin: verifiedAdmin } = await verifyAuthToken(req);
      const activeUserId = user ? user.id : String(userId || "guest");
      const activeEmail = user ? user.email : (userEmail || undefined);
      const isAdmin = verifiedAdmin || isAdminEmail(activeEmail);

      const isPro = isAdmin ? true : await checkStudentIsPro(activeUserId, activeEmail);
      const resetDateStr = getNextMonthResetDate();

      if (!isAdmin && !isPro) {
        const testsTaken = await getStudentMonthlyTestCount(activeUserId, activeEmail, req);
        if (testsTaken >= 2) {
          const msg = `Free Plan Monthly Limit Reached: You've used your 2 free tests this month — upgrade to continue. Limit resets on ${resetDateStr}.`;
          return res.status(403).json({
            success: false,
            allowed: false,
            limitExceeded: true,
            error: msg,
            message: msg,
            currentUsage: testsTaken,
            limit: 2,
            remaining: 0,
            resetDate: resetDateStr,
          });
        }
      }

      const newAttemptCount = recordStudentTestStart(activeUserId, activeEmail);
      return res.json({
        success: true,
        allowed: true,
        currentUsage: newAttemptCount,
        limit: isPro || isAdmin ? 999999 : 2,
        remaining: isPro || isAdmin ? 999999 : Math.max(0, 2 - newAttemptCount),
        resetDate: resetDateStr,
      });
    } catch (err: any) {
      console.error("[/api/record-test-start error]:", err);
      return res.status(500).json({ success: false, error: err?.message || "Failed to record test start" });
    }
  });

function formatRemainingTimeString(ms: number): string {
  if (ms <= 0) return "0 minutes";
  const totalMins = Math.ceil(ms / (1000 * 60));
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;

  if (hours > 0) {
    if (mins > 0) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} and ${mins} ${mins === 1 ? 'minute' : 'minutes'}`;
    }
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }
  return `${mins} ${mins === 1 ? 'minute' : 'minutes'}`;
}

  // API Endpoint: Server-side check & record PDF download limits
  app.post("/api/check-pdf-download", async (req, res) => {
    try {
      const { userId, userEmail } = req.body || {};
      const { user, isAdmin: verifiedAdmin } = await verifyAuthToken(req);
      const activeUserId = user ? user.id : String(userId || "guest");
      const activeEmail = user ? user.email : (userEmail || undefined);
      const isAdmin = verifiedAdmin || isAdminEmail(activeEmail);

      // Server-side check if user is Paid/Pro or Admin strictly from verified database record
      const isPro = isAdmin ? true : await checkStudentIsPro(activeUserId, activeEmail);

      console.log(`[/api/check-pdf-download] Entitlement evaluation for activeUser=${activeUserId} (${activeEmail}):`, {
        isAdmin,
        isProResult: isPro,
      });

      // Requirement 1: Free tier users are blocked from downloading PDFs entirely
      if (!isPro) {
        return res.status(200).json({
          success: false,
          allowed: false,
          reason: "FREE_USER",
          isPro: false,
          message: "PDF downloads are a Pro feature — upgrade to unlock unlimited access",
        });
      }

      // Pro / Paid user confirmed: Pro users have unlimited back-to-back PDF downloads (no cooldown / rate limit)
      const nowMs = Date.now();
      const nowIso = new Date(nowMs).toISOString();
      const activeUserKey = activeUserId && activeUserId !== "guest" ? activeUserId : (activeEmail ? activeEmail.toLowerCase() : "guest");

      // Record download timestamp in-memory & DB for history, but DO NOT block or rate-limit Pro users
      inMemoryPdfDownloadStore[activeUserKey] = nowIso;
      if (activeEmail) {
        inMemoryPdfDownloadStore[activeEmail.toLowerCase()] = nowIso;
      }

      console.log(`[/api/check-pdf-download] Authorized Pro user! Updated inMemoryPdfDownloadStore for ${activeUserKey}:`, inMemoryPdfDownloadStore[activeUserKey]);

      const db = getSupabaseAdminClient() || supabaseServer;
      if (db) {
        try {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          const updateObj = {
            last_pdf_download_at: nowIso,
            last_pdf_download_date: nowIso,
          };
          let updateRes: any = null;
          if (activeUserId && uuidRegex.test(activeUserId)) {
            updateRes = await db.from("students").update(updateObj).eq("id", activeUserId);
          } else if (activeEmail) {
            updateRes = await db.from("students").update(updateObj).eq("email", activeEmail);
          }

          if (updateRes?.error) {
            if (activeUserId && uuidRegex.test(activeUserId)) {
              await db.from("students").update({ last_pdf_download_date: nowIso }).eq("id", activeUserId);
            } else if (activeEmail) {
              await db.from("students").update({ last_pdf_download_date: nowIso }).eq("email", activeEmail);
            }
          }
        } catch (err) {
          console.warn("[/api/check-pdf-download] Supabase update error:", err);
        }
      }

      return res.status(200).json({
        success: true,
        allowed: true,
        isPro: true,
        message: "PDF download authorized",
        lastPdfDownloadAt: nowIso,
        lastPdfDownloadDate: nowIso,
        serverDate: nowIso,
      });
    } catch (err: any) {
      console.error("[/api/check-pdf-download error]:", err);
      return res.status(500).json({
        success: false,
        allowed: false,
        reason: "ERROR",
        message: err?.message || "Failed to check PDF download permission.",
      });
    }
  });

  // Admin endpoint: reset or adjust PDF download limit for testing
  app.post("/api/admin/reset-pdf-limit", async (req, res) => {
    try {
      const { userId, userEmail, adjustMinutes } = req.body || {};
      const { user } = await verifyAuthToken(req);
      const activeUserId = user ? user.id : String(userId || "");
      const activeEmail = user ? user.email : (userEmail || undefined);

      const keysToClear = Array.from(new Set([
        activeUserId,
        activeEmail ? activeEmail.toLowerCase() : "",
        userId ? String(userId) : "",
        userEmail ? String(userEmail).toLowerCase() : ""
      ].filter(Boolean)));

      const targetTime = typeof adjustMinutes === "number"
        ? new Date(Date.now() - adjustMinutes * 60 * 1000).toISOString()
        : null;

      for (const k of keysToClear) {
        if (targetTime) {
          inMemoryPdfDownloadStore[k] = targetTime;
        } else {
          delete inMemoryPdfDownloadStore[k];
        }
      }

      const db = getSupabaseAdminClient() || supabaseServer;
      if (db) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (activeUserId && uuidRegex.test(activeUserId)) {
          await db.from("students").update({ last_pdf_download_at: targetTime, last_pdf_download_date: targetTime }).eq("id", activeUserId);
        } else if (activeEmail) {
          await db.from("students").update({ last_pdf_download_at: targetTime, last_pdf_download_date: targetTime }).eq("email", activeEmail);
        }
      }

      return res.json({
        success: true,
        message: targetTime
          ? `PDF download timestamp adjusted to ${targetTime}`
          : "PDF download limit cleared/reset successfully.",
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || "Reset failed" });
    }
  });
  app.get("/api/custom-topics", async (req, res) => {
    try {
      const subject = String(req.query.subject || "Physics");
      const topics = await getSharedCustomTopics(subject);
      return res.json({ success: true, topics });
    } catch (err: any) {
      console.error("[api/custom-topics error]:", err);
      return res.json({ success: true, topics: [] });
    }
  });

  // API Endpoint: Save a new shared custom topic
  app.post("/api/custom-topics", async (req, res) => {
    try {
      const { subject, topicName } = req.body;
      if (!subject || !topicName) {
        return res.status(400).json({ success: false, error: "Missing subject or topicName" });
      }
      const result = await saveSharedCustomTopic(subject, topicName);
      return res.json({ success: true, topicName: result.topicName });
    } catch (err: any) {
      console.error("[api/custom-topics POST error]:", err);
      return res.status(500).json({ success: false, error: err?.message || "Failed to save custom topic" });
    }
  });

  // API Endpoint: Start Active Test Session (Server-enforced Free Tier Limit Check)
  app.post("/api/start-test-session", async (req, res) => {
    try {
      const { userId = "guest", userEmail, config, questions = [] } = req.body || {};
      const isAdmin = isAdminEmail(userEmail);
      const studentIsPro = isAdmin ? true : await checkStudentIsPro(userId, userEmail);

      const currentTestCount = isAdmin ? 0 : await getStudentMonthlyTestCount(userId, userEmail, req);

      const isGrandMock = Boolean(
        config?.isFullMock ||
        (config?.questionCount && Number(config.questionCount) >= 100) ||
        (config?.subject && String(config.subject).toLowerCase().includes("full mock"))
      );

      // Enforce Pro-only for Grand Mocks (100/180 MCQs)
      if (!isAdmin && !studentIsPro && isGrandMock) {
        return res.status(403).json({
          success: false,
          grandMockRestricted: true,
          error: "Full 100/180 MCQ Grand Mocks are a Pro feature — upgrade to Boardly Pro to access full entrance exam simulations.",
          message: "Full Grand Mocks require Pro",
        });
      }

      // Enforce free-tier limit: max 2 tests/month
      if (!isAdmin && !studentIsPro && currentTestCount >= 2) {
        const resetDateStr = getNextMonthResetDate();
        const errorMessage = `Free Plan Monthly Limit Reached: You have used all 2 of 2 tests allowed for this calendar month. Your limit resets on ${resetDateStr}, or you can upgrade to Pro for unlimited tests!`;
        return res.status(403).json({
          success: false,
          limitExceeded: true,
          error: errorMessage,
          message: errorMessage,
          currentUsage: currentTestCount,
          limit: 2,
          remaining: 0,
          resetDate: resetDateStr,
        });
      }

      // Record test start for free user
      let newUsage = currentTestCount;
      if (!isAdmin && !studentIsPro && userId && userId !== "guest") {
        newUsage = recordStudentTestStart(userId, userEmail);
      }

      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      if (sessionId) endedSessionIds.delete(sessionId);
      if (userId && userId !== 'guest') endedUserTimestamps.delete(String(userId));
      if (userEmail) endedUserTimestamps.delete(String(userEmail));

      const session: ServerActiveTestSession = {
        sessionId,
        userId: String(userId),
        userEmail: userEmail ? String(userEmail) : undefined,
        config: config || {},
        questions: Array.isArray(questions) ? questions : [],
        currentIndex: 0,
        userAnswers: {},
        timeLeftSeconds: (config?.durationMinutes || 10) * 60,
        startedAt: Date.now(),
        updatedAt: Date.now(),
      };

      saveActiveTestSession(session);

      // Record in persistent test sessions
      try {
        const sessionRecord: ServerTestSessionRecord = {
          id: sessionId,
          session_id: sessionId,
          student_id: String(userId),
          student_email: userEmail ? String(userEmail) : undefined,
          student_name: userEmail ? String(userEmail).split('@')[0] : (userId !== 'guest' ? String(userId) : 'Guest Student'),
          subject: config?.subject || 'Practice Test',
          path_label: config?.path === 'mdcat' ? 'MDCAT' : (config?.path === 'tcat' ? 'ECAT/NUMS' : (config?.classNum ? `Class ${config.classNum}` : 'Board Exams')),
          status: 'in_progress',
          total_questions: Array.isArray(questions) ? questions.length : (config?.questionCount || 10),
          total: Array.isArray(questions) ? questions.length : (config?.questionCount || 10),
          mcqs_attempted: 0,
          score: 0,
          percentage: 0,
          duration: `${config?.durationMinutes || 10}m 0s`,
          time_taken_seconds: 0,
          date_str: new Date().toLocaleDateString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          questions_count: Array.isArray(questions) ? questions.length : (config?.questionCount || 10),
        };
        persistentTestSessions.set(sessionId, sessionRecord);
        savePersistentSessions();
      } catch (sessErr) {
        console.warn("[start-test-session persistent record warning]:", sessErr);
      }

      return res.json({
        success: true,
        sessionId,
        session,
        usage: {
          currentUsage: newUsage,
          limit: studentIsPro ? 999999 : 2,
          remaining: studentIsPro ? 999999 : Math.max(0, 2 - newUsage),
        },
      });
    } catch (err: any) {
      console.error("[/api/start-test-session error]:", err);
      return res.status(500).json({ success: false, error: err?.message || "Failed to start test session" });
    }
  });

  // API Endpoint: Query Active Test Session for Resume on Refresh
  app.all("/api/get-active-test-session", async (req, res) => {
    try {
      const userId = String(req.query.userId || req.body?.userId || "");
      const userEmail = req.query.userEmail ? String(req.query.userEmail) : (req.body?.userEmail ? String(req.body.userEmail) : undefined);
      const sessionId = req.query.sessionId ? String(req.query.sessionId) : (req.body?.sessionId ? String(req.body.sessionId) : undefined);

      const activeSession = getActiveTestSessionForUser(userId, userEmail, sessionId);
      if (activeSession) {
        return res.json({
          success: true,
          active: true,
          session: activeSession,
        });
      }

      return res.json({
        success: true,
        active: false,
      });
    } catch (err: any) {
      console.error("[/api/get-active-test-session error]:", err);
      return res.status(500).json({ success: false, error: err?.message || "Failed to query active session" });
    }
  });

  // API Endpoint: Update In-Progress Active Test Session
  app.post("/api/update-test-session", async (req, res) => {
    try {
      const { userId, userEmail, sessionId, currentIndex, userAnswers, timeLeftSeconds, questions, config } = req.body || {};
      
      if (isSessionEnded(sessionId, userId, userEmail)) {
        return res.json({ success: true, updated: false, ended: true, message: "Test session was ended" });
      }

      let session = getActiveTestSessionForUser(userId, userEmail, sessionId);

      if (!session && config && Array.isArray(questions) && questions.length > 0 && !isSessionEnded(sessionId, userId, userEmail)) {
        session = {
          sessionId: sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          userId: String(userId || 'guest'),
          userEmail: userEmail ? String(userEmail) : undefined,
          config,
          questions,
          currentIndex: typeof currentIndex === 'number' ? currentIndex : 0,
          userAnswers: userAnswers || {},
          timeLeftSeconds: typeof timeLeftSeconds === 'number' ? timeLeftSeconds : (config.durationMinutes * 60),
          startedAt: Date.now(),
          updatedAt: Date.now(),
        };
        saveActiveTestSession(session);
      }

      if (session) {
        if (typeof currentIndex === 'number') session.currentIndex = currentIndex;

        // Server-side Answer Locking: preserve any answer that is already locked on the server
        if (userAnswers && typeof userAnswers === 'object') {
          const currentAnswers = session.userAnswers || {};
          const mergedAnswers: Record<number, any> = { ...currentAnswers };

          for (const key of Object.keys(userAnswers)) {
            const idx = Number(key);
            const incomingAns = userAnswers[idx];
            const existingAns = currentAnswers[idx];

            if (existingAns && existingAns.selectedOption !== null && existingAns.selectedOption !== undefined) {
              // Existing answer is already locked on server — lock remains immutable
              mergedAnswers[idx] = {
                ...incomingAns,
                selectedOption: existingAns.selectedOption,
                timeSpentSeconds: Math.max(existingAns.timeSpentSeconds || 0, incomingAns?.timeSpentSeconds || 0),
              };
            } else {
              mergedAnswers[idx] = incomingAns;
            }
          }
          session.userAnswers = mergedAnswers;
        }

        if (typeof timeLeftSeconds === 'number') session.timeLeftSeconds = timeLeftSeconds;
        if (Array.isArray(questions) && questions.length > 0) session.questions = questions;
        if (config && typeof config === 'object') session.config = config;
        session.updatedAt = Date.now();

        saveActiveTestSession(session);

        // Update persistent session mcqs_attempted
        try {
          const sid = session.sessionId;
          const existingPersist = persistentTestSessions.get(sid);
          if (existingPersist && existingPersist.status !== 'submitted') {
            const attemptedCount = session.userAnswers ? Object.keys(session.userAnswers).length : 0;
            existingPersist.mcqs_attempted = attemptedCount;
            existingPersist.updated_at = new Date().toISOString();
            savePersistentSessions();
          }
        } catch (persErr) {
          console.warn("[update-test-session persistent record warning]:", persErr);
        }

        return res.json({ success: true, updated: true, userAnswers: session.userAnswers, session });
      }

      return res.json({ success: true, updated: false, message: "No active session found to update" });
    } catch (err: any) {
      console.error("[/api/update-test-session error]:", err);
      return res.status(500).json({ success: false, error: err?.message || "Failed to update active test session" });
    }
  });

  // API Endpoint: Finish / Clear Active Test Session
  app.post("/api/finish-test-session", async (req, res) => {
    try {
      const { userId, userEmail, sessionId } = req.body || {};
      clearActiveTestSession(userId, userEmail, sessionId);

      // If session was left incomplete / exited, update status to abandoned if not submitted
      if (sessionId) {
        try {
          const existingPersist = persistentTestSessions.get(sessionId);
          if (existingPersist && existingPersist.status === 'in_progress') {
            existingPersist.status = 'abandoned';
            existingPersist.updated_at = new Date().toISOString();
            savePersistentSessions();
          }
        } catch (persErr) {
          console.warn("[finish-test-session persistent record warning]:", persErr);
        }
      }

      return res.json({ success: true, cleared: true });
    } catch (err: any) {
      console.error("[/api/finish-test-session error]:", err);
      return res.status(500).json({ success: false, error: err?.message || "Failed to finish test session" });
    }
  });

  // API Endpoint: Generate MCQs via Gemini AI or Cache (with 100 monthly hard limit enforcement)
  app.post("/api/generate-mcqs", async (req, res) => {
    const serverStartMs = Date.now();
    let geminiApiDurationMs = 0;
    let ruleValidationDurationMs = 0;

    const {
      customTopic,
      topic: requestedTopic,
      subtopic,
      chapterName,
      path: pathType = "boards",
      classNum,
      group,
      questionCount = 10,
      difficulty = "Exam Standard",
      mode = "ai-custom",
      userId = "guest",
      userEmail,
      bypassCache = false,
      isFullMock = false,
      groupSubjects = [],
      isFirstBatch: isFirstBatchExplicit,
    } = req.body || {};

    const isFirstBatch = Boolean(isFirstBatchExplicit) || (!req.body?.isBackgroundBatch && (!req.body?.batchOffset || Number(req.body?.batchOffset) === 0));
    const rawSubject = String(req.body?.subject || "Physics");
    const subject = normalizeSubjectKey(rawSubject);

    const requestedCount = Math.max(1, Number(questionCount) || 10);
    const batchOffset = Math.max(0, Number(req.body.batchOffset) || 0);
    const excludeStemSet = new Set<string>(
      Array.isArray(req.body.excludeStems)
        ? req.body.excludeStems.map((s: any) => normalizeQuestionStem(String(s || '')))
        : []
    );

    // Look up previously seen questions for this student across attempts to prioritize fresh unseen questions
    if (userId && userId !== "guest") {
      try {
        const studentSeen = await getSeenQuestionStemsForStudent(String(userId), userEmail, rawSubject);
        for (const s of studentSeen) excludeStemSet.add(s);
      } catch (err) {
        console.warn("[generate-mcqs] Error fetching student seen stems:", err);
      }
    }

    // CRITICAL: Progressive & Instant Full Mock Generation (MDCAT 180 MCQs / TCAT 100 MCQs)
    const isMdcatFullMock = isFullMock && (rawSubject.toLowerCase().includes("mdcat") || String(classNum) === "MDCAT" || String(group) === "MDCAT");
    const isTcatFullMock = isFullMock && (rawSubject.toLowerCase().includes("tcat") || String(classNum) === "TCAT" || String(group) === "TCAT");
    const isAnyFullMock = isFullMock || rawSubject.toLowerCase().includes("full mock") || (requestedTopic && String(requestedTopic).toLowerCase().includes("full mock"));

    // Server-side Payment & Subscription Status Enforcement
    const isAdminUser = isAdminEmail(userEmail);
    if (!isAdminUser) {
      const isPro = await checkStudentIsPro(String(userId || "guest"), userEmail);
      if (!isPro) {
        // Free-tier Quota Check: max 2 practice tests/month
        const testsTaken = await getStudentMonthlyTestCount(String(userId || "guest"), userEmail, req);
        if (testsTaken >= 2) {
          const resetDateStr = getNextMonthResetDate();
          const msg = `You've used your 2 free tests this month — upgrade to continue. Limit resets on ${resetDateStr}.`;
          return res.status(403).json({
            success: false,
            limitExceeded: true,
            error: msg,
            message: msg,
            currentUsage: testsTaken,
            limit: 2,
            remaining: 0,
            resetDate: resetDateStr,
          });
        }

        // Check 2: Grand Mock Exams (100/180 MCQs) are strictly Pro-only
        const isGrandMockRequested = isMdcatFullMock || isTcatFullMock || isAnyFullMock || requestedCount >= 100;
        if (isGrandMockRequested) {
          return res.status(403).json({
            success: false,
            locked: true,
            grandMockRestricted: true,
            paymentRequired: true,
            error: "Grand Mock Exams (100/180 MCQs) are locked on the Free Starter plan. Upgrade to Boardly Pro for full entrance exam simulations.",
            message: "Grand Mock Exams require a Pro subscription. Please upgrade to Pro."
          });
        }
      }
    }

    const isMdcatRequest = isMdcatFullMock ||
      (isAnyFullMock && rawSubject.toLowerCase().includes("mdcat")) ||
      pathType === 'mdcat' ||
      String(classNum) === 'MDCAT' ||
      String(group) === 'MDCAT' ||
      rawSubject.toLowerCase().includes("mdcat");

    if (isMdcatRequest) {
      const isFull = isMdcatFullMock || (isAnyFullMock && rawSubject.toLowerCase().includes("mdcat")) || requestedCount >= 180;
      if (isFull) {
        console.log(`[Full Mock Request] MDCAT Full Mock (Offset: ${batchOffset}, Count: ${requestedCount})`);
        const fullBank = deduplicateQuestions(generateMDCATFullMockBank(excludeStemSet));
        let filteredBank = fullBank;
        if (excludeStemSet.size > 0) {
          const unseen = fullBank.filter(q => !excludeStemSet.has(normalizeQuestionStem(q.q || '')));
          filteredBank = unseen.length >= requestedCount ? unseen : fullBank;
        }

        const questions = filteredBank.slice(0, requestedCount);

        return res.json({
          success: true,
          selectedSubject: "MDCAT Full Mock",
          subjectSentToGemini: "MDCAT Full Mock",
          subjectReturned: "MDCAT Full Mock",
          questions,
          totalTargetCount: 180,
          batchOffset,
          usage: {
            currentUsage: 0,
            limit: 100,
            remaining: 999999,
            resetDate: getNextMonthResetDate(),
            isAdmin: true,
          },
        });
      } else {
        // MDCAT Chapter or Subject Practice: exclusively pull from verified hardcoded bank, prioritizing unseen questions
        const effectiveTopic = customTopic || requestedTopic || chapterName || "";
        console.log(`[MDCAT Practice Request] ${rawSubject} - ${effectiveTopic} (Count: ${requestedCount}, Excluded seen: ${excludeStemSet.size})`);
        const mdcatQuestions = deduplicateQuestions(getMDCATPrebuiltQuestions(rawSubject, requestedCount, effectiveTopic, chapterName, subtopic, excludeStemSet));
        return res.json({
          success: true,
          selectedSubject: rawSubject,
          subjectSentToGemini: rawSubject,
          subjectReturned: rawSubject,
          questions: mdcatQuestions,
          totalTargetCount: mdcatQuestions.length,
          batchOffset,
          usage: {
            currentUsage: 0,
            limit: 100,
            remaining: 999999,
            resetDate: getNextMonthResetDate(),
            isAdmin: true,
          },
        });
      }
    }

    const isTcatRequest = isTcatFullMock ||
      (isAnyFullMock && rawSubject.toLowerCase().includes("tcat")) ||
      pathType === 'tcat' ||
      String(classNum) === 'TCAT' ||
      String(group) === 'TCAT' ||
      rawSubject.toLowerCase().includes("tcat");

    if (isTcatRequest) {
      const isFull = isTcatFullMock || (isAnyFullMock && rawSubject.toLowerCase().includes("tcat")) || requestedCount >= 100;
      if (isFull) {
        console.log(`[Full Mock Request] TCAT Full Mock (Offset: ${batchOffset}, Count: ${requestedCount})`);
        const fullBank = deduplicateQuestions(generateTCATFullMockBank(
          Array.isArray(groupSubjects) && groupSubjects.length > 0 ? groupSubjects : (chapterName || customTopic || rawSubject),
          excludeStemSet
        ));
        let filteredBank = fullBank;
        if (excludeStemSet.size > 0) {
          const unseen = fullBank.filter(q => !excludeStemSet.has(normalizeQuestionStem(q.q || '')));
          filteredBank = unseen.length >= requestedCount ? unseen : fullBank;
        }

        const questions = filteredBank.slice(0, requestedCount);

        return res.json({
          success: true,
          selectedSubject: "TCAT Full Mock",
          subjectSentToGemini: "TCAT Full Mock",
          subjectReturned: "TCAT Full Mock",
          questions,
          totalTargetCount: 100,
          batchOffset,
          usage: {
            currentUsage: 0,
            limit: 100,
            remaining: 999999,
            resetDate: getNextMonthResetDate(),
            isAdmin: true,
          },
        });
      } else {
        // TCAT Chapter or Subject Practice: exclusively pull from verified hardcoded bank, prioritizing unseen questions
        const effectiveTopic = customTopic || requestedTopic || chapterName || "";
        console.log(`[TCAT Practice Request] ${rawSubject} - ${effectiveTopic} (Count: ${requestedCount}, Excluded seen: ${excludeStemSet.size})`);
        const tcatQuestions = deduplicateQuestions(getTCATPrebuiltQuestions(rawSubject, requestedCount, effectiveTopic, chapterName, subtopic, excludeStemSet));
        return res.json({
          success: true,
          selectedSubject: rawSubject,
          subjectSentToGemini: rawSubject,
          subjectReturned: rawSubject,
          questions: tcatQuestions,
          totalTargetCount: tcatQuestions.length,
          batchOffset,
          usage: {
            currentUsage: 0,
            limit: 100,
            remaining: 999999,
            resetDate: getNextMonthResetDate(),
            isAdmin: true,
          },
        });
      }
    }

    // Entrance Exam Tracks (MUET, NET, FAST, ECAT, ETEA, NUMS, GIKI, USAT, NED, PIEAS, NAT, IBA, AKU, LUMS, NUML, HITEC, NUTECH)
    const rawSubLower = rawSubject.toLowerCase();
    const groupLower = String(group || "").toLowerCase();
    const classStrLower = String(classNum || "").toLowerCase();
    const topicStrLower = String(customTopic || requestedTopic || "").toLowerCase();
    const effectiveIsFullMock = isAnyFullMock || isFullMock || rawSubLower.includes("full mock") || rawSubLower.includes("grand mock") || topicStrLower.includes("full mock") || topicStrLower.includes("grand mock");

    interface EntranceTrackDefinition {
      name: string;
      matcher: boolean;
      mockCount: number;
      getMockBank: () => any[];
    }

    const entranceTracks: EntranceTrackDefinition[] = [
      {
        name: 'MUET',
        matcher: rawSubLower.includes('muet') || groupLower.includes('muet') || classStrLower === 'muet',
        mockCount: 100,
        getMockBank: () => {
          const stream = Array.isArray(groupSubjects)
            ? (groupSubjects.some((s: any) => String(s).toLowerCase().includes('bio')) ? 'Pre-Medical' : (groupSubjects.some((s: any) => String(s).toLowerCase().includes('comp') || String(s).toLowerCase().includes('cs')) ? 'ICS' : 'Pre-Engineering'))
            : (chapterName || customTopic || 'Pre-Engineering');
          return generateMuetFullMockBank(stream, excludeStemSet);
        }
      },
      {
        name: 'NET',
        matcher: rawSubLower.includes('net') || groupLower.includes('net') || classStrLower === 'net',
        mockCount: 200,
        getMockBank: () => generateNetFullMockBank(excludeStemSet)
      },
      {
        name: 'FAST',
        matcher: rawSubLower.includes('fast') || groupLower.includes('fast') || classStrLower === 'fast',
        mockCount: 120,
        getMockBank: () => generateFastFullMockBank(excludeStemSet)
      },
      {
        name: 'ECAT',
        matcher: rawSubLower.includes('ecat') || groupLower.includes('ecat') || classStrLower === 'ecat',
        mockCount: 100,
        getMockBank: () => generateEcatFullMockBank(Array.isArray(groupSubjects) ? groupSubjects.join(' ') : (chapterName || customTopic || 'Pre-Engineering'), excludeStemSet)
      },
      {
        name: 'ETEA',
        matcher: rawSubLower.includes('etea') || groupLower.includes('etea') || classStrLower === 'etea',
        mockCount: 100,
        getMockBank: () => generateEteaFullMockBank(Array.isArray(groupSubjects) ? groupSubjects.join(' ') : (chapterName || customTopic || 'Engineering (Chemistry)'), excludeStemSet)
      },
      {
        name: 'NUMS',
        matcher: rawSubLower.includes('nums') || groupLower.includes('nums') || classStrLower === 'nums',
        mockCount: 150,
        getMockBank: () => generateNumsFullMockBank(excludeStemSet)
      },
      {
        name: 'GIKI',
        matcher: rawSubLower.includes('giki') || groupLower.includes('giki') || classStrLower === 'giki',
        mockCount: 80,
        getMockBank: () => generateGikiFullMockBank(excludeStemSet)
      },
      {
        name: 'USAT',
        matcher: rawSubLower.includes('usat') || groupLower.includes('usat') || classStrLower === 'usat',
        mockCount: 100,
        getMockBank: () => generateUsatFullMockBank(Array.isArray(groupSubjects) ? groupSubjects.join(' ') : (chapterName || customTopic || 'USAT-E'), excludeStemSet)
      },
      {
        name: 'NED',
        matcher: rawSubLower.includes('ned') || groupLower.includes('ned') || classStrLower === 'ned',
        mockCount: 100,
        getMockBank: () => generateNedFullMockBank(excludeStemSet)
      },
      {
        name: 'PIEAS',
        matcher: rawSubLower.includes('pieas') || groupLower.includes('pieas') || classStrLower === 'pieas',
        mockCount: 100,
        getMockBank: () => generatePieasFullMockBank(Array.isArray(groupSubjects) ? groupSubjects.join(' ') : (chapterName || customTopic || 'Pre-Engineering'), excludeStemSet)
      },
      {
        name: 'NAT',
        matcher: rawSubLower.includes('nat') || groupLower.includes('nat') || classStrLower === 'nat',
        mockCount: 90,
        getMockBank: () => generateNatFullMockBank(Array.isArray(groupSubjects) ? groupSubjects.join(' ') : (chapterName || customTopic || 'NAT-IE'), excludeStemSet)
      },
      {
        name: 'IBA',
        matcher: rawSubLower.includes('iba') || groupLower.includes('iba') || classStrLower === 'iba',
        mockCount: 100,
        getMockBank: () => generateIbaFullMockBank(excludeStemSet)
      },
      {
        name: 'AKU',
        matcher: rawSubLower.includes('aku') || groupLower.includes('aku') || classStrLower === 'aku',
        mockCount: 100,
        getMockBank: () => generateAkuFullMockBank(excludeStemSet)
      },
      {
        name: 'LUMS',
        matcher: rawSubLower.includes('lums') || groupLower.includes('lums') || classStrLower === 'lums',
        mockCount: 100,
        getMockBank: () => generateLumsFullMockBank(Array.isArray(groupSubjects) ? groupSubjects.join(' ') : (chapterName || customTopic || 'LCAT'), excludeStemSet)
      },
      {
        name: 'NUML',
        matcher: rawSubLower.includes('numl') || groupLower.includes('numl') || classStrLower === 'numl',
        mockCount: 75,
        getMockBank: () => generateNumlFullMockBank(Array.isArray(groupSubjects) ? groupSubjects.join(' ') : (chapterName || customTopic || 'Engineering & CS'), excludeStemSet)
      },
      {
        name: 'HITEC',
        matcher: rawSubLower.includes('hitec') || groupLower.includes('hitec') || classStrLower === 'hitec',
        mockCount: 100,
        getMockBank: () => generateHitecFullMockBank(Array.isArray(groupSubjects) ? groupSubjects.join(' ') : (chapterName || customTopic || 'Engineering'), excludeStemSet)
      },
      {
        name: 'NUTECH',
        matcher: rawSubLower.includes('nutech') || groupLower.includes('nutech') || classStrLower === 'nutech',
        mockCount: 100,
        getMockBank: () => generateNutechFullMockBank(Array.isArray(groupSubjects) ? groupSubjects.join(' ') : (chapterName || customTopic || 'Engineering'), excludeStemSet)
      },
    ];

    const matchedEntranceTrack = entranceTracks.find(t => t.matcher);
    if (matchedEntranceTrack) {
      const isFull = effectiveIsFullMock || requestedCount >= 50;
      if (isFull) {
        console.log(`[Entrance Mock Request] ${matchedEntranceTrack.name} Full Mock (Offset: ${batchOffset}, Count: ${requestedCount})`);
        const fullBank = deduplicateQuestions(matchedEntranceTrack.getMockBank());
        let filteredBank = fullBank;
        if (excludeStemSet.size > 0) {
          const unseen = fullBank.filter((q: any) => !excludeStemSet.has(normalizeQuestionStem(q.q || '')));
          filteredBank = unseen.length >= requestedCount ? unseen : fullBank;
        }
        const questions = filteredBank.slice(0, requestedCount);
        return res.json({
          success: true,
          selectedSubject: `${matchedEntranceTrack.name} Full Mock`,
          subjectSentToGemini: `${matchedEntranceTrack.name} Full Mock`,
          subjectReturned: `${matchedEntranceTrack.name} Full Mock`,
          questions,
          totalTargetCount: matchedEntranceTrack.mockCount,
          batchOffset,
          usage: {
            currentUsage: 0,
            limit: 100,
            remaining: 999999,
            resetDate: getNextMonthResetDate(),
            isAdmin: true,
          },
        });
      } else {
        // Entrance Track Subject / Chapter Practice
        console.log(`[Entrance Practice Request] ${matchedEntranceTrack.name} - ${rawSubject} (Count: ${requestedCount}, Excluded seen: ${excludeStemSet.size})`);
        const entranceQuestions = deduplicateQuestions(getEntranceExamQuestions(matchedEntranceTrack.name as any, rawSubject, requestedCount, excludeStemSet));
        return res.json({
          success: true,
          selectedSubject: rawSubject,
          subjectSentToGemini: rawSubject,
          subjectReturned: rawSubject,
          questions: entranceQuestions,
          totalTargetCount: entranceQuestions.length,
          batchOffset,
          usage: {
            currentUsage: 0,
            limit: 100,
            remaining: 999999,
            resetDate: getNextMonthResetDate(),
            isAdmin: true,
          },
        });
      }
    }

    const isAdmin = isAdminEmail(userEmail);
    const isMdcat = pathType === 'mdcat' || String(classNum) === 'MDCAT' || String(group) === 'MDCAT';
    const resetDateStr = getNextMonthResetDate();

    // Determine effective topic for subtopic-granularity support
    let effectiveTopic = customTopic || requestedTopic;
    if (!effectiveTopic) {
      if (chapterName && subtopic) {
        effectiveTopic = `${chapterName} - ${subtopic}`;
      } else if (subtopic) {
        effectiveTopic = subtopic;
      } else if (chapterName) {
        effectiveTopic = chapterName;
      }
    }
    const topicLabel = effectiveTopic || `${subject} Syllabus`;

    // Save custom topic or subtopic if provided
    if (effectiveTopic && typeof effectiveTopic === 'string' && effectiveTopic.trim()) {
      await saveSharedCustomTopic(subject, effectiveTopic);
    }

    // 0. Server-Side Course Registration & Grade/Stream Lock Verification
    let activeClassNum = Number(classNum) || 11;
    let activeGroup = String(group || "Pre-Medical");

    if (userId && userId !== "guest" && !isAdmin && !isMdcat) {
      let studentRecord: any = null;
      if (getAuthClient(req || null)) {
        try {
          const { data } = await supabaseServer
            .from("students")
            .select("*")
            .eq("id", userId)
            .maybeSingle();
          studentRecord = data;
        } catch (dbErr) {
          console.warn("[Course Reg Lock Check Warning]:", dbErr);
        }
      }

      // Respect requested class and group, falling back to student record if unspecified
      const savedGrade = studentRecord?.grade || "";
      const savedStream = studentRecord?.stream || "";

      let fallbackClassNum = 11;
      if (savedGrade.includes("9")) fallbackClassNum = 9;
      else if (savedGrade.includes("10")) fallbackClassNum = 10;
      else if (savedGrade.includes("11")) fallbackClassNum = 11;
      else if (savedGrade.includes("12")) fallbackClassNum = 12;

      let fallbackGroup = "Pre-Medical";
      if (savedStream.includes("Biology")) fallbackGroup = "Medical";
      else if (savedStream.includes("Computer Science")) fallbackGroup = "Computer Science";
      else if (savedStream.includes("Pre-Engineering")) fallbackGroup = "Pre-Engineering";
      else if (savedStream.includes("ICS")) fallbackGroup = "ICS";

      activeClassNum = classNum ? Number(classNum) : fallbackClassNum;
      activeGroup = group ? String(group) : fallbackGroup;
    }

    // Query student Pro status and monthly test usage BEFORE cache lookups or AI generation
    const studentIsPro = isAdmin ? true : await checkStudentIsPro(userId, userEmail);
    const currentTestCount = isAdmin ? 0 : await getStudentMonthlyTestCount(userId, userEmail, req);
    const isBackgroundBatch = Boolean(req.body.isBackgroundBatch || req.body.sessionId);
    const hasActiveSession = Boolean(getActiveTestSessionForUser(userId, userEmail, req.body.sessionId));

    // Server-side Monthly Test Limit Enforcement (Free Plan = 2 tests/month, Pro Plan/Admin = Unlimited)
    if (!isAdmin && !studentIsPro && currentTestCount >= 2 && !isBackgroundBatch && !hasActiveSession) {
      const errorMessage = `Free Plan Monthly Limit Reached: You have used all 2 of 2 tests allowed for this calendar month. Your limit resets on ${resetDateStr}, or you can upgrade to Pro for unlimited tests!`;
      return res.status(403).json({
        success: false,
        limitExceeded: true,
        error: errorMessage,
        message: errorMessage,
        currentUsage: currentTestCount,
        requestedCount,
        limit: 2,
        remaining: 0,
        resetDate: resetDateStr,
      });
    }

    // 1. CACHE LOOKUP: Check saved Question Bank in Supabase before calling AI
    if (!bypassCache && topicLabel && topicLabel !== `${subject} Board Syllabus` && topicLabel !== `${subject} FBISE Syllabus` && topicLabel !== "All Topics") {
      try {
        const cachedBank = await getCachedMcqs(subject, topicLabel, activeClassNum);
        if (Array.isArray(cachedBank) && cachedBank.length >= 1) {
          let filteredCached = cachedBank.filter(q => {
            if (excludeStemSet.has((q.q || '').toLowerCase().replace(/[^a-z0-9]/g, ''))) return false;
            return checkQuestionTopicRelevance(q.q || '', q.topic, q.options || [], q.explain || '', topicLabel, subject);
          });

          if (filteredCached.length >= requestedCount) {
            const shuffledCached = [...filteredCached].sort(() => 0.5 - Math.random());
            const selectedCached = shuffledCached.slice(0, requestedCount);

            console.log(`[MCQ Cache Served]: Returned ${selectedCached.length} strictly on-topic cached questions for "${subject}" - "${topicLabel}"`);
            return res.json({
              success: true,
              selectedSubject: subject,
              subjectSentToGemini: subject,
              subjectReturned: subject,
              questions: selectedCached,
              cached: true,
              usage: {
                currentUsage: currentTestCount,
                limit: studentIsPro ? 999999 : 2,
                remaining: studentIsPro ? 999999 : Math.max(0, 2 - currentTestCount),
                resetDate: resetDateStr,
                isAdmin,
              }
            });
          }
        }
      } catch (cacheErr) {
        console.warn("[MCQ Cache Lookup Error, continuing to AI generation]:", cacheErr);
      }
    }

    let finalQuestions: MCQQuestion[] = [];
    const targetTopicConstraint = effectiveTopic || customTopic || requestedTopic || topicLabel;

    // Fetch student weakness profile for adaptive prompt injection
    let weaknessProfile: StudentWeaknessProfile | null = null;
    if (userId && userId !== "guest") {
      try {
        weaknessProfile = await getStudentWeaknessProfile(userId, subject);
        if (weaknessProfile && weaknessProfile.totalAttempts > 0) {
          console.log(`[Adaptive Gemini Context] Loaded weakness profile for user ${userId} in ${subject}: Accuracy ${weaknessProfile.overallAccuracy}%, Weakest: ${weaknessProfile.weakestTopics.map(w => w.chapter).join(", ")}`);
        }
      } catch (profErr) {
        console.warn("[Adaptive Gemini Context Error]:", profErr);
      }
    }

    let geminiError: string | null = null;

    // Try generating with Gemini AI if requested or in ai-custom mode
    if (mode === "ai-custom" || customTopic || mode === "instant") {
      try {
        const ai = getGeminiClient();
        if (!ai) {
          geminiError = "GEMINI_API_KEY is not configured on the server. Please check environment secrets.";
          console.warn("[Gemini AI Error]:", geminiError);
        } else {
          const systemInstruction = `You are a senior academic curriculum specialist and senior chief examination creator for Board Examinations (Classes 9, 10, 11, and 12).

Your sole responsibility is to generate high-yield, 100% factually accurate, flawless multiple choice questions (MCQs) strictly mapped to the Board curriculum for the specified Class and Group combination.

STRICT CURRICULUM BOUNDARIES:
- For Class 9 and 10: The two groups are 'Medical' and 'Computer Science'.
- For Class 11 and 12: The three groups are 'Pre-Medical', 'Pre-Engineering', and 'ICS'.
- Class 9 & Class 11 NEVER include Pakistan Studies.
- Class 10 & Class 12 INCLUDE Pakistan Studies.
- Ensure every generated question is strictly suited for Class ${activeClassNum} (${activeGroup}) Board level.

STRICT CRITERIA & MANDATORY REQUIREMENTS:
1. FACTUAL & ACADEMIC ACCURACY:
   - Every single question stem, answer choice, mathematical equation, scientific constant, and explanation MUST be 100% factually accurate and verified against accredited textbooks.

2. ABSOLUTE CORRECT ANSWER MATCHING:
   - The 'correct' field MUST be an integer between 0 and 3 corresponding EXACTLY to the ZERO-BASED index of the options array that contains the 100% correct answer.

3. SPELLING, GRAMMAR & FORMATTING QUALITY CONTROL:
   - Ensure perfect English/Urdu spelling, proper subject terminology, correct SI units/qawaid, and perfect grammar.

4. DISTINCT & PLAUSIBLE OPTIONS:
   - Each question must contain EXACTLY 4 distinct, plausible options with EXACTLY ONE correct answer.

5. STRICT SUBJECT SEPARATION:
   - Every question MUST belong strictly to the requested subject "${subject}". NEVER output questions from other subjects (e.g., NO Physics questions for Urdu/English, NO Chemistry questions for Computer Science).

6. LANGUAGE MANDATE FOR URDU & ISLAMIAT:
   - If subject is "Urdu", "Islamiat", or "Islamic Studies", ALL question stems (q), option choices (options), topics (topic), and explanations (explain) MUST BE WRITTEN 100% IN URDU SCRIPT (اردو زبان). Do NOT use any English words or Latin letters in questions, options, or explanations for Urdu and Islamiat. NEVER generate Physics, Chemistry, Biology, Mathematics, or Science questions for Urdu or Islamiat.

7. MATH & FORMULA LATEX FORMATTING MANDATE:
   - For all mathematical formulas, equations, matrices, fractions, square roots, integrals, limits, and exponents in questions, options, or explanations, use clean LaTeX syntax:
   - Stacked Fractions: Use \\frac{num}{den} (e.g., \\frac{1}{2}, \\frac{\\sin(5x)}{x}).
   - Square Roots: Use \\sqrt{expression} (e.g., \\sqrt{x^2 + y^2}).
   - Matrices: Use \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}.
   - Wrap LaTeX expressions in single dollar signs $...$ or double dollar signs $$...$$.

8. STRICT TOPIC & CHAPTER BOUNDARY (HARD CONSTRAINT):
   - When a specific topic or chapter is specified (e.g. "${targetTopicConstraint}"), Generate questions ONLY about ${targetTopicConstraint}. Do not include questions from other chapters or unrelated concepts, even if tangentially related. Questions MUST focus strictly on definitions, formulas, calculations, principles, and applications belonging to "${targetTopicConstraint}". Every question's stem (q), options, and explanation MUST directly test concepts from "${targetTopicConstraint}" and NO OTHER chapter or topic.

9. NO PLACEHOLDER OR GENERIC PHRASES:
   - NEVER generate generic placeholder options, template filler phrases, or abstract terms like 'Concept 1', 'Concept 2', 'Secondary empirical approximation', 'Inverse derivative constant', 'Unrelated systemic formula', or 'Primary fundamental principle'.
   - EVERY question stem, option choice, and explanation MUST contain REAL, factually accurate, curriculum-specific facts, formulas, SI units, definitions, and calculations for the requested subject and topic "${targetTopicConstraint}".`;

          let subjectConstraintNote = "";
          const subLower = subject.toLowerCase();
          if (subLower.includes("urdu")) {
            subjectConstraintNote = `CRITICAL URDU MANDATE: Generate authentic Urdu MCQs for Board Class ${classNum || 11}. ALL text MUST be in Urdu script. DO NOT output any science/Physics questions.`;
          } else if (subLower.includes("islam") || subLower.includes("din")) {
            subjectConstraintNote = `CRITICAL ISLAMIAT MANDATE: Generate authentic Islamiat MCQs for Board Class ${classNum || 11}. ALL text MUST be in Urdu script. DO NOT output any science/Physics questions.`;
          }

          let adaptiveContextText = "";
          if (weaknessProfile && weaknessProfile.totalAttempts > 0 && weaknessProfile.promptContext) {
            const isSpecificTopic = targetTopicConstraint && 
              !targetTopicConstraint.toLowerCase().includes("syllabus") && 
              !targetTopicConstraint.toLowerCase().includes("all topic") && 
              !targetTopicConstraint.toLowerCase().includes("full mock") &&
              !targetTopicConstraint.toLowerCase().includes("full exam");

            if (isSpecificTopic) {
              adaptiveContextText = `\n\nADAPTIVE TOPIC FOCUS: The student is practicing specifically on "${targetTopicConstraint}". Focus on testing key concepts, definitions, and formulas within "${targetTopicConstraint}". Generate questions ONLY about ${targetTopicConstraint}. Do not include questions from other chapters or unrelated concepts, even if tangentially related.`;
            } else {
              adaptiveContextText = `\n\n${weaknessProfile.promptContext}`;
            }
          }

          let scopeInstruction = "";
          if (subtopic && chapterName) {
            scopeInstruction = `SCOPE LEVEL: SPECIFIC SUBTOPIC\nSubject: ${subject}\nChapter: ${chapterName}\nSubtopic: ${subtopic}\nSTRICT BOUNDARY: Generate questions ONLY from subtopic "${subtopic}" within chapter "${chapterName}" in subject "${subject}". Do NOT include questions from any other subtopics, any other chapters, or any other subjects.`;
          } else if (subtopic) {
            scopeInstruction = `SCOPE LEVEL: SPECIFIC SUBTOPIC\nSubject: ${subject}\nSubtopic: ${subtopic}\nSTRICT BOUNDARY: Generate questions ONLY from subtopic "${subtopic}" in subject "${subject}". Do NOT include questions from any other subtopics, any other chapters, or any other subjects.`;
          } else if (chapterName) {
            scopeInstruction = `SCOPE LEVEL: FULL CHAPTER\nSubject: ${subject}\nChapter: ${chapterName}\nSTRICT BOUNDARY: Generate questions ONLY from subtopics belonging to chapter "${chapterName}" in subject "${subject}". Do NOT include questions from any other chapters, and do NOT include questions from any other subjects.`;
          } else {
            scopeInstruction = `SCOPE LEVEL: FULL SUBJECT PRACTICE (${subject})\nSubject: ${subject}\nSTRICT BOUNDARY: Questions may span all chapters within subject "${subject}", but MUST NOT include any questions from other subjects (e.g. NO Chemistry, Biology, Mathematics, or English questions in a ${subject} test). Every question MUST belong strictly to "${subject}".`;
          }

          const userPrompt = `Generate ${requestedCount} multiple choice questions (MCQs) for:
Subject: ${subject}
${isMdcat ? 'Exam Type: PMDC MDCAT / TCAT Entrance Exam' : `Class Level: Class ${activeClassNum}\nGroup/Stream: ${activeGroup}`}
${chapterName ? `Chapter: ${chapterName}` : ''}
${subtopic ? `Subtopic: ${subtopic}` : ''}
${effectiveTopic ? `Topic/Syllabus Focus: ${effectiveTopic}` : ''}
Target Difficulty Level: ${difficulty}
${subjectConstraintNote}${adaptiveContextText}

${scopeInstruction}`;

          console.log(`[Gemini MCQ Request Start] Subject: "${subject}", Topic: "${targetTopicConstraint}", Class: ${activeClassNum}, Group: "${activeGroup}", Offset: ${batchOffset}, Count: ${requestedCount}, User: ${userId}`);

          const modelsToTry = ["gemini-3.6-flash", "gemini-flash-latest"];
          const maxAttempts = 3;

          for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const needed = requestedCount - finalQuestions.length;
            if (needed <= 0) break;

            const modelName = modelsToTry[attempt % modelsToTry.length];
            // Request in compact batches (5 for first batch to guarantee <10s start, 7 for background)
            const requestCountForAttempt = isFirstBatch ? Math.min(needed, 5) : Math.min(needed, 7);

            let excludeInstruction = "";
            const avoidStems: string[] = [];
            if (finalQuestions.length > 0) {
              avoidStems.push(...finalQuestions.map(q => q.q));
            }
            if (excludeStemSet.size > 0) {
              // Include a sample of previously seen question stems so Gemini avoids duplicating them
              avoidStems.push(...Array.from(excludeStemSet).slice(0, 15));
            }
            if (avoidStems.length > 0) {
              excludeInstruction = `\n\nDO NOT generate or repeat any of the following questions already completed by the student:\n${avoidStems.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}`;
            }

            const attemptUserPrompt = `Generate ${requestCountForAttempt} multiple choice questions (MCQs) for:
Subject: ${subject}
${isMdcat ? 'Exam Type: PMDC MDCAT / TCAT Entrance Exam' : `Class Level: Class ${activeClassNum}\nGroup/Stream: ${activeGroup}`}
${chapterName ? `Chapter: ${chapterName}` : ''}
${subtopic ? `Subtopic: ${subtopic}` : ''}
${effectiveTopic ? `Topic/Syllabus Focus: ${effectiveTopic}` : ''}
Target Difficulty Level: ${difficulty}
${subjectConstraintNote}${adaptiveContextText}

${scopeInstruction}${excludeInstruction}`;

            const startMs = Date.now();
            try {
              console.log(`[Gemini Attempt ${attempt + 1}/${maxAttempts}] Requesting ${requestCountForAttempt} MCQs with ${modelName} for "${subject}" - "${targetTopicConstraint}" (Needed: ${needed}, isFirstBatch: ${isFirstBatch})`);

              const geminiCall = ai.models.generateContent({
                model: modelName,
                contents: attemptUserPrompt,
                config: {
                  systemInstruction,
                  temperature: 0.1,
                  topP: 0.95,
                  topK: 40,
                  responseMimeType: "application/json",
                  responseSchema: {
                    type: Type.ARRAY,
                    description: "List of verified multiple choice questions",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        q: { type: Type.STRING, description: `Factually accurate question strictly about ${targetTopicConstraint}.` },
                        options: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                          description: "Array of exactly 4 distinct choices."
                        },
                        correct: {
                          type: Type.INTEGER,
                          description: "Zero-based index (0, 1, 2, or 3) indicating WHICH option in options array is the correct answer."
                        },
                        topic: { type: Type.STRING, description: `Must be "${targetTopicConstraint}" or a sub-concept directly within ${targetTopicConstraint}.` },
                        explain: { type: Type.STRING, description: "Detailed, step-by-step academic explanation." }
                      },
                      required: ["q", "options", "correct", "topic", "explain"]
                    }
                  }
                }
              });

              // 35-second timeout per Gemini call to accommodate complex prompt generation without prematurely dropping requests
              const timeoutCall = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error(`Gemini API call to ${modelName} timed out after 35 seconds`)), 35000)
              );

              const response = await Promise.race([geminiCall, timeoutCall]);
              const elapsedMs = Date.now() - startMs;
              geminiApiDurationMs += elapsedMs;

              const responseText = response.text || "";
              console.log(`[Gemini Response Received in ${elapsedMs}ms from ${modelName}]: Length ${responseText.length} chars`);

              if (responseText) {
                const valStartMs = Date.now();
                const rawParsed = repairAndParseJson(responseText);
                const validatedQs = validateAndFixQuestions(rawParsed, subject, topicLabel, difficulty, targetTopicConstraint);
                const valElapsedMs = Date.now() - valStartMs;
                ruleValidationDurationMs += valElapsedMs;

                let addedInAttempt = 0;
                if (validatedQs.length > 0) {
                  for (const vq of validatedQs) {
                    const normStem = vq.q.toLowerCase().replace(/[^a-z0-9]/g, '');
                    if (!finalQuestions.some(existing => existing.q.toLowerCase().replace(/[^a-z0-9]/g, '') === normStem)) {
                      finalQuestions.push(vq);
                      addedInAttempt++;
                    }
                    if (finalQuestions.length >= requestedCount) break;
                  }
                }

                console.log(`[Gemini Attempt ${attempt + 1}/${maxAttempts} Result] Validated: ${validatedQs.length}/${rawParsed.length} (in ${valElapsedMs}ms), Added: ${addedInAttempt}, Total now: ${finalQuestions.length}/${requestedCount}`);

                if (validatedQs.length < rawParsed.length) {
                  console.warn(`[Gemini Validation Warning] Attempt ${attempt + 1}: ${rawParsed.length - validatedQs.length} questions rejected. Parsed count: ${rawParsed.length}`);
                }

                if (finalQuestions.length >= requestedCount) {
                  console.log(`[Gemini Target Met] Successfully gathered ${finalQuestions.length}/${requestedCount} authentic questions.`);
                  break;
                }
              }
            } catch (modelErr: any) {
              const elapsedMs = Date.now() - startMs;
              geminiApiDurationMs += elapsedMs;
              const statusCode = modelErr?.status || modelErr?.statusCode || 500;
              console.error(`[Gemini Attempt ${attempt + 1}/${maxAttempts} Error in ${elapsedMs}ms on ${modelName} (Status ${statusCode})]:`, modelErr?.message || modelErr);
              geminiError = modelErr?.message || String(modelErr);

              // Backoff before next attempt
              if (attempt < maxAttempts - 1) {
                await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 1000));
              }
            }
          }

          if (finalQuestions.length < requestedCount) {
            console.warn(`[MCQ Generation Retries Exhausted] Generated ${finalQuestions.length}/${requestedCount} authentic questions for "${subject}" - "${targetTopicConstraint}". Filling remaining slots from local bank.`);
          }
        }
      } catch (err: any) {
        geminiError = err?.message || String(err);
        console.error("[Gemini AI MCQ generation error]:", geminiError);
      }
    }

    // High-reliability fallback: If Gemini was unavailable or returned fewer than requestedCount questions,
    // populate from our authentic local question bank so students are NEVER blocked!
    if (finalQuestions.length < requestedCount) {
      try {
        const allLocal = loadLocalMcqs();
        const normSubj = subject.toLowerCase().trim();
        const normTopic = (topicLabel || "").toLowerCase().trim();

        // 1. First priority: subject + topic matching questions
        let candidates = allLocal.filter(item => {
          const itemSubj = (item.subject || "").toLowerCase().trim();
          const matchSubj = itemSubj === normSubj ||
            (normSubj.includes('physic') && itemSubj.includes('physic')) ||
            (normSubj.includes('chem') && itemSubj.includes('chem')) ||
            (normSubj.includes('bio') && itemSubj.includes('bio')) ||
            (normSubj.includes('math') && itemSubj.includes('math')) ||
            (normSubj.includes('comput') && itemSubj.includes('comput')) ||
            (normSubj.includes('urdu') && itemSubj.includes('urdu')) ||
            (normSubj.includes('islam') && itemSubj.includes('islam')) ||
            (normSubj.includes('pak') && itemSubj.includes('pak')) ||
            (normSubj.includes('eng') && itemSubj.includes('eng'));

          if (!matchSubj) return false;
          if (!normTopic || normTopic.includes('syllabus') || normTopic.includes('all topic')) return true;

          const itemChap = (item.chapter || item.subtopic || "").toLowerCase().trim();
          return itemChap.includes(normTopic) || normTopic.includes(itemChap);
        });

        // 2. Second priority: broader subject matching
        if (candidates.length < (requestedCount - finalQuestions.length)) {
          const broader = allLocal.filter(item => {
            const itemSubj = (item.subject || "").toLowerCase().trim();
            return itemSubj === normSubj ||
              (normSubj.includes('physic') && itemSubj.includes('physic')) ||
              (normSubj.includes('chem') && itemSubj.includes('chem')) ||
              (normSubj.includes('bio') && itemSubj.includes('bio')) ||
              (normSubj.includes('math') && itemSubj.includes('math')) ||
              (normSubj.includes('comput') && itemSubj.includes('comput')) ||
              (normSubj.includes('urdu') && itemSubj.includes('urdu')) ||
              (normSubj.includes('islam') && itemSubj.includes('islam')) ||
              (normSubj.includes('pak') && itemSubj.includes('pak')) ||
              (normSubj.includes('eng') && itemSubj.includes('eng'));
          });
          const existingCandIds = new Set(candidates.map(c => c.id));
          for (const b of broader) {
            if (!existingCandIds.has(b.id)) {
              candidates.push(b);
            }
          }
        }

        // Exclude questions already in finalQuestions
        const existingQTexts = new Set(finalQuestions.map(q => q.q.toLowerCase().trim()));
        candidates = candidates.filter(c => !existingQTexts.has((c.question_text || c.q || '').toLowerCase().trim()));

        // Prioritize unseen questions over previously seen ones
        const unseenCandidates = candidates.filter(c => !excludeStemSet.has(normalizeQuestionStem(c.question_text || c.q || '')));
        const seenCandidates = candidates.filter(c => excludeStemSet.has(normalizeQuestionStem(c.question_text || c.q || '')));
        unseenCandidates.sort(() => Math.random() - 0.5);
        seenCandidates.sort(() => Math.random() - 0.5);
        const prioritizedCandidates = [...unseenCandidates, ...seenCandidates];

        for (const c of prioritizedCandidates) {
          if (finalQuestions.length >= requestedCount) break;
          finalQuestions.push({
            id: c.id || `local-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            q: c.question_text || c.q,
            options: Array.isArray(c.options) ? c.options : [],
            correct: typeof c.correct_option === 'number' ? c.correct_option : Number(c.correct ?? 0),
            explain: c.explanation || c.explain || '',
            topic: c.chapter || c.subtopic || subject,
            difficulty: 'medium',
          });
        }
      } catch (localFallbackErr) {
        console.warn("[Local MCQ Fallback Error]:", localFallbackErr);
      }
    }

    // Save generated MCQs to question cache for future reuse across students
    if (finalQuestions.length > 0 && topicLabel && topicLabel !== `${subject} Board Syllabus` && topicLabel !== `${subject} FBISE Syllabus` && topicLabel !== "All Topics") {
      try {
        await saveMcqsToCache(subject, topicLabel, finalQuestions, activeClassNum);
      } catch (cacheSaveErr) {
        console.warn("[saveMcqsToCache error]:", cacheSaveErr);
      }
    }

    // Question generation does not consume test allowance directly; active test start is tracked in /api/start-test-session
    const newUsage = currentTestCount;

    // Ensure all questions have randomized option positions and corrected answer indices
    finalQuestions = finalQuestions.map(shuffleQuestionOptions);

    const totalServerDurationMs = Date.now() - serverStartMs;
    console.log(`[MCQ Performance Benchmark] Batch: ${isFirstBatch ? 'FIRST BATCH (Instant Start Target <=10s)' : 'Background Batch'} | Gemini: ${geminiApiDurationMs}ms | Validation: ${ruleValidationDurationMs}ms | Total Server: ${totalServerDurationMs}ms | Questions: ${finalQuestions.length}/${requestedCount}`);

    res.setHeader("X-Response-Time-Ms", String(totalServerDurationMs));
    res.setHeader("Server-Timing", `gemini;dur=${geminiApiDurationMs}, val;dur=${ruleValidationDurationMs}, total;dur=${totalServerDurationMs}`);

    return res.json({
      success: true,
      selectedSubject: subject,
      subjectSentToGemini: subject,
      subjectReturned: subject,
      questions: finalQuestions,
      isFirstBatch,
      latency: {
        geminiMs: geminiApiDurationMs,
        validationMs: ruleValidationDurationMs,
        totalServerMs: totalServerDurationMs,
      },
      adaptiveContextApplied: Boolean(weaknessProfile && weaknessProfile.totalAttempts > 0),
      weaknessProfile: weaknessProfile || undefined,
      usage: {
        currentUsage: newUsage,
        limit: studentIsPro ? 999999 : 2,
        remaining: studentIsPro ? 999999 : Math.max(0, 2 - newUsage),
        resetDate: resetDateStr,
        isAdmin,
        isPro: studentIsPro,
      },
    });
  });

  // API Endpoint: Log MCQ attempts for student weakness tracking
  app.post("/api/log-mcq-attempts", async (req, res) => {
    try {
      const { studentId, studentEmail, subject, attempts } = req.body;
      if (!studentId || !Array.isArray(attempts) || attempts.length === 0) {
        return res.status(400).json({ success: false, error: "Missing studentId or attempts array" });
      }

      const result = await logStudentMcqAttempts(studentId, studentEmail, subject, attempts);
      const updatedProfile = await getStudentWeaknessProfile(studentId, subject);

      return res.json({
        success: true,
        loggedCount: result.count,
        profile: updatedProfile,
      });
    } catch (err: any) {
      console.error("[api/log-mcq-attempts error]:", err);
      return res.status(500).json({ success: false, error: err?.message || "Failed to log MCQ attempts" });
    }
  });

  // API Endpoint: Fetch student weakness profile & weakness analytics
  app.get("/api/student-weakness-profile", async (req, res) => {
    try {
      const studentId = String(req.query.studentId || "");
      const studentEmail = req.query.email || req.query.studentEmail ? String(req.query.email || req.query.studentEmail) : undefined;
      const subject = req.query.subject ? String(req.query.subject) : undefined;

      if (!studentId && !studentEmail) {
        return res.status(400).json({ success: false, error: "Missing studentId or email query parameter" });
      }

      const profile = await getStudentWeaknessProfile(studentId, subject, studentEmail);
      return res.json({ success: true, profile });
    } catch (err: any) {
      console.error("[api/student-weakness-profile error]:", err);
      return res.status(500).json({ success: false, error: err?.message || "Failed to fetch weakness profile" });
    }
  });

  // API Endpoint: Get all student weakness profiles for Admin Dashboard
  app.get("/api/admin/all-student-weakness-profiles", async (req, res) => {
    try {
      const requesterEmail = (req.query.adminEmail as string) || '';
      const { user, isAdmin: isTokenAdmin } = await verifyAuthToken(req);
      const isAdmin = isTokenAdmin || isAdminEmail(requesterEmail) || isAdminEmail(user?.email) || !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
      if (!isAdmin && requesterEmail && !isAdminEmail(requesterEmail)) {
        return res.status(403).json({ success: false, error: "Forbidden: Admin access required" });
      }

      // Aggregate in-memory + Supabase attempts across students
      const studentMap: Record<string, Set<string>> = {};

      for (const att of inMemoryMCQAttempts) {
        if (!studentMap[att.studentId]) {
          studentMap[att.studentId] = new Set();
        }
        studentMap[att.studentId].add(att.subject);
      }

      if (getAuthClient(req || null)) {
        try {
          const { data } = await getAuthClient(req || null)?.from("mcq_attempts").select("student_id, subject");
          if (Array.isArray(data)) {
            for (const row of data) {
              if (row.student_id) {
                if (!studentMap[row.student_id]) {
                  studentMap[row.student_id] = new Set();
                }
                studentMap[row.student_id].add(row.subject || "Mathematics");
              }
            }
          }
        } catch (dbErr) {
          console.warn("[Admin all-student-weakness fetch warning]:", dbErr);
        }
      }

      const profiles: StudentWeaknessProfile[] = [];
      for (const stId of Object.keys(studentMap)) {
        for (const sub of Array.from(studentMap[stId])) {
          const prof = await getStudentWeaknessProfile(stId, sub);
          if (prof.totalAttempts > 0) {
            profiles.push(prof);
          }
        }
      }

      return res.json({ success: true, profiles });
    } catch (err: any) {
      console.error("[api/admin/all-student-weakness-profiles error]:", err);
      return res.status(500).json({ success: false, error: err?.message || "Failed to fetch admin profiles" });
    }
  });

  // API Endpoint: Clear student test history (soft delete or permanent delete)
  app.post("/api/clear-test-history", async (req, res) => {
    const { studentId, softDelete = true, permanent = false } = req.body;
    if (!studentId) {
      return res.status(400).json({ success: false, error: "Missing studentId parameter" });
    }

    try {
      for (let i = inMemoryTestResults.length - 1; i >= 0; i--) {
        if (inMemoryTestResults[i].student_id === studentId) {
          if (permanent || softDelete === false) {
            inMemoryTestResults.splice(i, 1);
          } else {
            inMemoryTestResults[i].hidden_from_student = true;
          }
        }
      }

      if (permanent || softDelete === false) {
        // Admin permanent hard delete
        for (let i = inMemoryMCQAttempts.length - 1; i >= 0; i--) {
          if (inMemoryMCQAttempts[i].studentId === studentId) {
            inMemoryMCQAttempts.splice(i, 1);
          }
        }
        if (getAuthClient(req || null)) {
          await getAuthClient(req || null)?.from("test_results").delete().eq("student_id", studentId);
          await getAuthClient(req || null)?.from("mcq_attempts").delete().eq("student_id", studentId);
        }
      } else {
        // Student soft delete: update hidden_from_student = true
        if (getAuthClient(req || null)) {
          await supabaseServer
            .from("test_results")
            .update({ hidden_from_student: true })
            .eq("student_id", studentId);
        }
      }

      return res.json({ success: true });
    } catch (err: any) {
      console.error("[api/clear-test-history error]:", err);
      return res.status(500).json({ success: false, error: err?.message || "Failed to clear history" });
    }
  });

  // API Endpoint: Save completed practice test result (Supabase + Server Memory)
  app.post("/api/save-test-result", async (req, res) => {
    try {
      const {
        studentId,
        studentEmail,
        subject,
        pathLabel,
        score = 0,
        total = 0,
        percentage = 0,
        duration = "0m 0s",
        timeTakenSeconds = 0,
        dateStr = new Date().toLocaleDateString(),
        attempts = [],
      } = req.body;

      if (!studentId) {
        return res.status(400).json({ success: false, error: "Missing studentId parameter" });
      }

      const nowIso = new Date().toISOString();
      const numScore = Number(score) || 0;
      const numTotal = Number(total) || 0;
      const computedPct = numTotal > 0 ? Math.round((numScore / numTotal) * 100) : Number(percentage) || 0;

      const newResultItem: SavedTestResultItem = {
        id: `tr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        student_id: String(studentId),
        student_email: studentEmail || "",
        subject: subject || "Practice Test",
        path_label: pathLabel || "General",
        score: numScore,
        total: numTotal,
        percentage: computedPct,
        duration: String(duration),
        time_taken_seconds: Number(timeTakenSeconds) || 0,
        date_str: dateStr,
        created_at: nowIso,
        hidden_from_student: false,
      };

      inMemoryTestResults.unshift(newResultItem);
      if (inMemoryTestResults.length > 500) {
        inMemoryTestResults.pop();
      }
      savePersistentTestResults();

      // Authoritative in-memory tracking upon test completion
      const currentPeriod = getCurrentMonthPeriod();
      if (!inMemoryTestAttemptStore[currentPeriod]) {
        inMemoryTestAttemptStore[currentPeriod] = {};
      }
      if (studentId && studentId !== "guest") {
        const prevCount = inMemoryTestAttemptStore[currentPeriod][studentId] || 0;
        inMemoryTestAttemptStore[currentPeriod][studentId] = prevCount + 1;
      }
      const cleanEmail = studentEmail ? studentEmail.trim().toLowerCase() : (studentId.includes("@") ? studentId.trim().toLowerCase() : "");
      if (cleanEmail) {
        const prevEmailCount = inMemoryTestAttemptStore[currentPeriod][cleanEmail] || 0;
        inMemoryTestAttemptStore[currentPeriod][cleanEmail] = prevEmailCount + 1;
      }

      let supabaseSuccess = false;
      let supabaseErrorMsg: string | null = null;

      const targetDbClient = getAuthClient(req || null) || getSupabaseAdminClient() || supabaseServer;
      if (targetDbClient) {
        try {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          const validStudentUuid = uuidRegex.test(studentId) ? studentId : null;

          const rowToInsert = {
            student_id: validStudentUuid,
            student_email: studentEmail || (studentId.includes("@") ? studentId : null),
            subject: subject || "Practice Test",
            path_label: pathLabel || "General",
            score: numScore,
            total: numTotal,
            percentage: computedPct,
            duration: String(duration),
            time_taken_seconds: Number(timeTakenSeconds) || 0,
            date_str: dateStr,
            created_at: nowIso,
          };

          const { error } = await targetDbClient.from("test_results").insert(rowToInsert);
          if (error) {
            console.warn("[api/save-test-result Supabase insert error]:", error.message);
            supabaseErrorMsg = error.message;

            if (error.code === '23503' || error.code === '22P02') {
              console.log("[api/save-test-result]: Retrying insert with null student_id fallback...");
              const { error: retryErr } = await getAuthClient(req || null)?.from("test_results").insert({
                ...rowToInsert,
                student_id: null,
              });
              if (!retryErr) {
                supabaseSuccess = true;
              }
            }
          } else {
            supabaseSuccess = true;
            console.log(`[api/save-test-result]: Successfully saved test result to Supabase for student ${studentId}`);
            try {
              const client = getAuthClient(req || null) || getSupabaseAdminClient() || supabaseServer;
              if (client) {
                let stQuery = client.from("students").select("id, tests_used_this_month");
                if (validStudentUuid) {
                  stQuery = stQuery.eq("id", validStudentUuid);
                } else if (cleanEmail) {
                  stQuery = stQuery.eq("email", cleanEmail);
                } else if (studentId && studentId !== "guest") {
                  stQuery = stQuery.eq("id", studentId);
                }
                const { data: currentSt } = await stQuery.maybeSingle();
                if (currentSt) {
                  const nextUsed = (Number(currentSt.tests_used_this_month) || 0) + 1;
                  await client.from("students").update({ tests_used_this_month: nextUsed }).eq("id", currentSt.id);
                }
              }
            } catch (syncErr) {
              console.warn("[save-test-result] student tests_used sync warning:", syncErr);
            }

            for (const s of inMemoryStudents) {
              if (s.id === studentId || (cleanEmail && s.email.toLowerCase() === cleanEmail)) {
                s.tests_used_this_month = (s.tests_used_this_month || 0) + 1;
              }
            }
          }
        } catch (dbErr: any) {
          console.warn("[api/save-test-result Supabase exception]:", dbErr?.message || dbErr);
          supabaseErrorMsg = dbErr?.message || String(dbErr);
        }
      }

      if (Array.isArray(attempts) && attempts.length > 0) {
        try {
          await logStudentMcqAttempts(studentId, studentEmail, subject, attempts);
        } catch (attErr) {
          console.warn("[api/save-test-result logStudentMcqAttempts error]:", attErr);
        }
      }

      // Automatically record student activity log
      try {
        const studentIdentifier = studentEmail || studentId || "Student";
        const testActivityLog = {
          id: `act-test-${newResultItem.id}`,
          admin_email: studentEmail || "system",
          action_type: "test_completed",
          target_student_id: String(studentId),
          target_student_name: studentEmail || `Student (${String(studentId).substring(0, 8)})`,
          target_student_email: studentEmail || "",
          note: `Completed ${subject} practice test — Score: ${numScore}/${numTotal} (${computedPct}%) in ${duration}`,
          old_plan: undefined,
          new_plan: undefined,
          created_at: nowIso,
        };
        memoryActivityLogs.unshift(testActivityLog);
        if (memoryActivityLogs.length > 500) memoryActivityLogs.pop();

        const supabaseAdmin = getSupabaseAdminClient() || supabaseServer;
        if (supabaseAdmin) {
          supabaseAdmin.from('admin_activity_logs').insert(testActivityLog).catch(() => {});
        }
      } catch (logErr) {
        console.warn("[save-test-result activity log warning]:", logErr);
      }

      // Update or create persistent test session record
      try {
        const { sessionId } = req.body || {};
        let matchedSession: ServerTestSessionRecord | undefined;
        if (sessionId && persistentTestSessions.has(sessionId)) {
          matchedSession = persistentTestSessions.get(sessionId);
        } else {
          matchedSession = Array.from(persistentTestSessions.values()).find(
            (s) => s.status === 'in_progress' && (s.student_id === studentId || (studentEmail && s.student_email?.toLowerCase() === studentEmail.toLowerCase()))
          );
        }

        if (matchedSession) {
          matchedSession.status = 'submitted';
          matchedSession.score = numScore;
          matchedSession.total = numTotal;
          matchedSession.total_questions = numTotal;
          matchedSession.percentage = computedPct;
          matchedSession.mcqs_attempted = Array.isArray(attempts) && attempts.length > 0 ? attempts.length : numTotal;
          matchedSession.duration = String(duration);
          matchedSession.time_taken_seconds = Number(timeTakenSeconds) || 0;
          matchedSession.submitted_at = nowIso;
          matchedSession.updated_at = nowIso;
          matchedSession.test_result_id = newResultItem.id;
        } else {
          const newSid = sessionId || `sess-${newResultItem.id}`;
          persistentTestSessions.set(newSid, {
            id: newSid,
            session_id: newSid,
            student_id: String(studentId),
            student_email: studentEmail,
            student_name: studentEmail ? studentEmail.split('@')[0] : (studentId !== 'guest' ? String(studentId) : 'Student'),
            subject: subject || "Practice Test",
            path_label: pathLabel || "General",
            status: 'submitted',
            total_questions: numTotal,
            total: numTotal,
            mcqs_attempted: Array.isArray(attempts) && attempts.length > 0 ? attempts.length : numTotal,
            score: numScore,
            percentage: computedPct,
            duration: String(duration),
            time_taken_seconds: Number(timeTakenSeconds) || 0,
            date_str: dateStr,
            created_at: nowIso,
            updated_at: nowIso,
            submitted_at: nowIso,
            test_result_id: newResultItem.id,
            questions_count: numTotal,
          });
        }
        savePersistentSessions();
      } catch (sessSyncErr) {
        console.warn("[save-test-result session sync warning]:", sessSyncErr);
      }

      return res.json({
        success: true,
        savedItem: newResultItem,
        supabaseSuccess,
        supabaseError: supabaseErrorMsg,
      });
    } catch (err: any) {
      console.error("[api/save-test-result error]:", err);
      return res.status(500).json({ success: false, error: err?.message || "Failed to save test result" });
    }
  });

  // API Endpoint: Query questions seen by a student across attempts (for repeat prioritization)
  app.get("/api/student-seen-questions", async (req, res) => {
    try {
      const studentId = String(req.query.studentId || "");
      const studentEmail = String(req.query.studentEmail || "");
      const subject = req.query.subject ? String(req.query.subject) : undefined;
      const seen = await getSeenQuestionStemsForStudent(studentId, studentEmail, subject);
      return res.json({
        success: true,
        seenStems: Array.from(seen),
        total: seen.size,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || "Failed to get seen questions" });
    }
  });

  // API Endpoint: Record seen questions for a student
  app.post("/api/log-seen-questions", async (req, res) => {
    try {
      const { studentId = "guest", studentEmail = "", subject = "Practice", chapter = "", questions = [] } = req.body || {};
      if (Array.isArray(questions) && questions.length > 0) {
        const formattedAttempts = questions.map((q: any, idx: number) => ({
          questionId: q.id || `seen-${Date.now()}-${idx}`,
          questionText: q.q || q.questionText || "",
          chapter: chapter || q.topic || "General",
          isCorrect: true,
          selectedAnswer: 0,
          correctAnswer: 0,
          timeTakenSeconds: 15,
        }));
        await logStudentMcqAttempts(studentId, studentEmail, subject, formattedAttempts);
      }
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || "Failed to log seen questions" });
    }
  });

  // API Endpoint: Query test history for a specific student (Supabase + Server Memory merge)
  app.get("/api/user-test-history", async (req, res) => {
    try {
      const studentId = String(req.query.studentId || "");
      const userEmail = String(req.query.userEmail || "");
      if (!studentId && !userEmail) {
        return res.status(400).json({ success: false, error: "Missing studentId or userEmail query parameter" });
      }

      const resultsMap = new Map<string, any>();

      if (getAuthClient(req || null)) {
        try {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          const isUuid = uuidRegex.test(studentId);

          let query = supabaseServer
            .from("test_results")
            .select("*")
            .or("hidden_from_student.eq.false,hidden_from_student.is.null")
            .order("created_at", { ascending: false });

          if (studentId && userEmail) {
            query = query.or(`student_id.eq.${studentId},student_email.eq.${userEmail}`);
          } else if (isUuid) {
            query = query.or(`student_id.eq.${studentId},student_email.eq.${studentId}`);
          } else if (studentId) {
            query = query.or(`student_id.eq.${studentId},student_email.eq.${studentId}`);
          } else if (userEmail) {
            query = query.eq("student_email", userEmail);
          }

          const { data, error } = await query;
          if (error) {
            console.warn("[api/user-test-history Supabase query warning]:", error.message);
          } else if (Array.isArray(data)) {
            for (const row of data) {
              if (row.hidden_from_student) continue;
              const key = String(row.id);
              const score = Number(row.score ?? 0);
              const total = Number(row.total ?? 0);
              const calcPct = total > 0 ? Math.round((score / total) * 100) : 0;
              const rawPct = row.percentage !== null && row.percentage !== undefined && !isNaN(Number(row.percentage)) ? Number(row.percentage) : null;
              const percentage = rawPct && rawPct > 0 ? rawPct : (calcPct > 0 ? calcPct : (rawPct ?? 0));

              const itemDateStr = row.date_str || (row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);

              resultsMap.set(key, {
                id: String(row.id),
                dateStr: itemDateStr,
                subject: row.subject || "Practice Test",
                pathLabel: row.path_label || "General",
                percentage,
                score,
                total,
                timeTaken: row.duration || "0m 0s",
                hidden_from_student: Boolean(row.hidden_from_student),
              });
            }
          }
        } catch (dbErr) {
          console.warn("[api/user-test-history Supabase exception]:", dbErr);
        }
      }

      const memResults = inMemoryTestResults.filter(
        (item) => ((studentId && item.student_id === studentId) || (userEmail && item.student_email === userEmail)) && !item.hidden_from_student
      );
      for (const item of memResults) {
        const key = item.id;
        if (!resultsMap.has(key)) {
          resultsMap.set(key, {
            id: item.id,
            dateStr: item.date_str || new Date(item.created_at).toISOString().split('T')[0],
            subject: item.subject,
            pathLabel: item.path_label,
            percentage: item.percentage,
            score: item.score,
            total: item.total,
            timeTaken: item.duration,
            hidden_from_student: false,
          });
        }
      }

      const history = Array.from(resultsMap.values());
      return res.json({ success: true, history });
    } catch (err: any) {
      console.error("[api/user-test-history error]:", err);
      return res.status(500).json({ success: false, error: err?.message || "Failed to fetch test history" });
    }
  });

  // API Endpoint: Admin Fetch All Test Results (Supabase Admin Service-Role + Server Memory Merge)
  app.get("/api/admin/all-test-results", async (req, res) => {
    try {
      const resultsMap = new Map<string, any>();

      // 1. Query Supabase using admin service client (bypasses RLS)
      const supabaseAdmin = getSupabaseAdminClient() || supabaseServer;
      if (supabaseAdmin) {
        try {
          const { data, error } = await supabaseAdmin
            .from("test_results")
            .select("*")
            .order("created_at", { ascending: false });

          if (!error && Array.isArray(data)) {
            for (const row of data) {
              const score = Number(row.score ?? 0);
              const total = Number(row.total ?? 0);
              const calcPct = total > 0 ? Math.round((score / total) * 100) : 0;
              const rawPct = row.percentage !== null && row.percentage !== undefined && !isNaN(Number(row.percentage)) ? Number(row.percentage) : null;
              const percentage = rawPct && rawPct > 0 ? rawPct : (calcPct > 0 ? calcPct : (rawPct ?? 0));

              resultsMap.set(String(row.id), {
                id: String(row.id),
                student_id: row.student_id || row.student_email || "unknown",
                student_email: row.student_email || "",
                student_name: row.student_name || row.student_email || "",
                subject: row.subject || "General",
                path_label: row.path_label || "General",
                score,
                total,
                percentage,
                duration: row.duration || "0m",
                time_taken_seconds: Number(row.time_taken_seconds ?? 0),
                date_str: row.date_str || (row.created_at ? new Date(row.created_at).toLocaleDateString() : new Date().toLocaleDateString()),
                created_at: row.created_at || new Date().toISOString(),
                hidden_from_student: Boolean(row.hidden_from_student),
              });
            }
          }
        } catch (dbErr) {
          console.warn("[/api/admin/all-test-results db warning]:", dbErr);
        }
      }

      // 2. Query in-memory and newly submitted test results
      for (const item of inMemoryTestResults) {
        if (!resultsMap.has(item.id)) {
          resultsMap.set(item.id, {
            id: item.id,
            student_id: item.student_id || item.student_email || "unknown",
            student_email: item.student_email || "",
            student_name: item.student_email || item.student_id,
            subject: item.subject || "General",
            path_label: item.path_label || "General",
            score: item.score,
            total: item.total,
            percentage: item.percentage,
            duration: item.duration,
            time_taken_seconds: item.time_taken_seconds || 0,
            date_str: item.date_str || new Date(item.created_at).toLocaleDateString(),
            created_at: item.created_at || new Date().toISOString(),
            hidden_from_student: Boolean(item.hidden_from_student),
          });
        }
      }

      // 3. Query persistent test sessions that are submitted
      for (const sess of persistentTestSessions.values()) {
        if (sess.status === 'submitted') {
          const resId = sess.test_result_id || sess.id;
          if (!resultsMap.has(resId)) {
            resultsMap.set(resId, {
              id: resId,
              student_id: sess.student_id || sess.student_email || "unknown",
              student_email: sess.student_email || "",
              student_name: sess.student_name || sess.student_email || sess.student_id,
              subject: sess.subject || "General",
              path_label: sess.path_label || "General",
              score: sess.score || 0,
              total: sess.total || sess.total_questions || 10,
              percentage: sess.percentage || 0,
              duration: sess.duration || "0m",
              time_taken_seconds: sess.time_taken_seconds || 0,
              date_str: sess.date_str || (sess.submitted_at ? new Date(sess.submitted_at).toLocaleDateString() : new Date(sess.created_at).toLocaleDateString()),
              created_at: sess.submitted_at || sess.created_at || new Date().toISOString(),
              hidden_from_student: false,
            });
          }
        }
      }

      const allResults = Array.from(resultsMap.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      return res.json({ success: true, count: allResults.length, results: allResults });
    } catch (err: any) {
      console.error("[/api/admin/all-test-results error]:", err);
      return res.status(500).json({ success: false, error: err?.message || "Failed to fetch admin test results" });
    }
  });

  // API Endpoint: Admin Fetch All Test Sessions (In-Progress, Submitted, Abandoned)
  app.get("/api/admin/all-test-sessions", async (req, res) => {
    try {
      const sessions = Array.from(persistentTestSessions.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      return res.json({ success: true, count: sessions.length, sessions });
    } catch (err: any) {
      console.error("[/api/admin/all-test-sessions error]:", err);
      return res.status(500).json({ success: false, error: err?.message || "Failed to fetch test sessions" });
    }
  });

  // API Endpoint: Admin Update Student Grade & Stream (Server-Side Enforced & RLS Bypassed)
  app.post("/api/admin/update-student-grade-stream", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    console.log("[api/admin/update-student-grade-stream] Payload:", req.body);
    try {
      const { studentId, studentEmail, studentName, grade, stream, subjects = [], requesterEmail, adminEmail } = req.body || {};
      const { user: tokenUser, isAdmin: isTokenAdmin } = await verifyAuthToken(req);

      const requestedByEmail = (adminEmail || requesterEmail || tokenUser?.email || "").trim().toLowerCase();
      const isAdmin = isTokenAdmin || isAdminEmail(requestedByEmail);

      if (!isAdmin) {
        console.warn(`[Forbidden Access Attempt]: Unauthorized request attempted to update grade/stream for student ${studentId || studentEmail}`);
        return res.status(403).json({
          success: false,
          error: "Forbidden: Class and Stream updates are strictly restricted to authorized administrators.",
        });
      }

      if ((!studentId && !studentEmail) || !grade || !stream) {
        console.error("[api/admin/update-student-grade-stream] Missing parameters in payload:", req.body);
        return res.status(400).json({
          success: false,
          error: "Missing required parameters: studentId or studentEmail, grade, and stream are required.",
        });
      }

      // Sanitize grade and stream strings to fit database schema expectations
      const sanitizeGrade = (raw: string): string => {
        if (!raw) return "11th";
        const u = raw.toString().trim().toUpperCase();
        if (u.includes("MDCAT") || u.includes("MEDICAL ENTRANCE")) return "MDCAT";
        if (u.includes("TCAT") || u.includes("ENGINEERING ENTRANCE")) return "TCAT";
        if (u.includes("NET") || u.includes("NUST")) return "NET";
        if (u.includes("FAST") || u.includes("NAT")) return "FAST";
        if (u.includes("ECAT")) return "ECAT";
        if (u.includes("ETEA")) return "ETEA";
        if (u.includes("NUMS")) return "NUMS";
        if (u.includes("GIKI")) return "GIKI";
        if (u.includes("USAT")) return "USAT";
        if (u.includes("9")) return "9th";
        if (u.includes("10")) return "10th";
        if (u.includes("12")) return "12th";
        if (u.includes("11")) return "11th";
        return raw.toString().trim();
      };

      const sanitizeStream = (rawStream: string, rawGrade?: string): string => {
        if (!rawStream) return "Pre-Medical Stream";
        const u = rawStream.toString().trim().toUpperCase();
        const normGrade = sanitizeGrade(rawGrade || "");

        if (normGrade === "MDCAT") {
          if (u.includes("PRE-MEDICAL") || u.includes("BIOLOGY")) return "Pre-Medical Stream";
          return "MDCAT Stream";
        }
        if (normGrade === "TCAT") {
          if (u.includes("ICS") || u.includes("COMPUTER")) return "ICS Stream";
          if (u.includes("TCAT")) return "TCAT Stream";
          return "Pre-Engineering Stream";
        }
        if (normGrade === "NET") return "NUST NET Engineering & Computing";
        if (normGrade === "FAST") return "FAST-NU CS & Engineering";
        if (normGrade === "ECAT") return u.includes("ICS") ? "ECAT ICS Group" : "ECAT Engineering Group";
        if (normGrade === "ETEA") return u.includes("CS") ? "ETEA Computer Science" : "ETEA Engineering Group";
        if (normGrade === "NUMS") return "NUMS Medical Entry Test";
        if (normGrade === "GIKI") return "GIKI Engineering Entrance";
        if (normGrade === "USAT") return rawStream || "USAT-E (Pre-Engineering)";
        if (u.includes("ENGINEERING") || u.includes("PRE-ENG")) return "Pre-Engineering Stream";
        if (u.includes("ICS") || u.includes("COMPUTER") || u.includes("CS")) return "ICS Stream";
        if (u.includes("BIOLOGY")) return "Biology Stream";
        if (u.includes("MEDICAL") || u.includes("PRE-MED")) return "Pre-Medical Stream";
        return rawStream.toString().trim();
      };

      const cleanGrade = sanitizeGrade(grade);
      const cleanStream = sanitizeStream(stream, cleanGrade);

      let targetId = studentId || "";
      let targetEmail = studentEmail || (studentId && studentId.includes("@") ? studentId : "");

      const assignedClasses: string[] = [];
      const cleanUpper = (cleanGrade + " " + cleanStream).toUpperCase();
      if (cleanUpper.includes("MDCAT")) assignedClasses.push("MDCAT");
      if (cleanUpper.includes("TCAT")) assignedClasses.push("TCAT");
      if (cleanUpper.includes("NET") || cleanUpper.includes("NUST")) assignedClasses.push("NET");
      if (cleanUpper.includes("FAST") || cleanUpper.includes("NAT")) assignedClasses.push("FAST");
      if (cleanUpper.includes("ECAT")) assignedClasses.push("ECAT");
      if (cleanUpper.includes("ETEA")) assignedClasses.push("ETEA");
      if (cleanUpper.includes("NUMS")) assignedClasses.push("NUMS");
      if (cleanUpper.includes("GIKI")) assignedClasses.push("GIKI");
      if (cleanUpper.includes("USAT")) assignedClasses.push("USAT");
      if (cleanUpper.includes("9") || cleanUpper.includes("NINTH")) assignedClasses.push("Class 9");
      if (cleanUpper.includes("10") || cleanUpper.includes("TENTH") || cleanUpper.includes("MATRIC")) assignedClasses.push("Class 10");
      if (cleanUpper.includes("11") || cleanUpper.includes("FIRST YEAR") || cleanUpper.includes("1ST YEAR")) assignedClasses.push("Class 11");
      if (cleanUpper.includes("12") || cleanUpper.includes("SECOND YEAR") || cleanUpper.includes("2ND YEAR")) assignedClasses.push("Class 12");
      if (assignedClasses.length === 0) assignedClasses.push(cleanGrade || "Class 11");

      let defaultTargetUni = "Board Exams";
      if (cleanUpper.includes("MDCAT")) defaultTargetUni = "UHS / PMDC";
      else if (cleanUpper.includes("TCAT")) defaultTargetUni = "UET Taxila";
      else if (cleanUpper.includes("NET") || cleanUpper.includes("NUST")) defaultTargetUni = "NUST Islamabad";
      else if (cleanUpper.includes("FAST") || cleanUpper.includes("NAT")) defaultTargetUni = "FAST-NUCES";
      else if (cleanUpper.includes("ECAT")) defaultTargetUni = "UET Lahore";
      else if (cleanUpper.includes("ETEA")) defaultTargetUni = "UET Peshawar";
      else if (cleanUpper.includes("NUMS")) defaultTargetUni = "Army Medical College (NUMS)";
      else if (cleanUpper.includes("GIKI")) defaultTargetUni = "GIKI Topi";
      else if (cleanUpper.includes("USAT")) defaultTargetUni = "HEC Recognized Universities";

      // 1. Immediately update inMemoryStudents so server memory stays in sync
      let inMemoryFound = false;
      for (const s of inMemoryStudents) {
        if (
          (targetId && s.id === targetId) ||
          (targetEmail && s.email && s.email.toLowerCase() === targetEmail.toLowerCase()) ||
          (studentId && s.id === studentId)
        ) {
          s.grade = cleanGrade;
          s.stream = cleanStream;
          (s as any).is_registered = true;
          (s as any).assigned_classes = assignedClasses;
          (s as any).subjects = subjects;
          (s as any).updated_at = new Date().toISOString();
          inMemoryFound = true;
        }
      }

      if (!inMemoryFound) {
        inMemoryStudents.unshift({
          id: targetId || ("student_" + Date.now()),
          name: studentName || (targetEmail ? targetEmail.split("@")[0] : "Student"),
          email: targetEmail || (targetId && targetId.includes("@") ? targetId : ""),
          phone: "",
          grade: cleanGrade,
          stream: cleanStream,
          is_pro: false,
          package_name: "Free",
          subscribed_plans: [cleanGrade],
          payment_status: "free",
          status: "active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          tests_used_this_month: 0,
          is_registered: true,
          assigned_classes: assignedClasses,
          subjects: subjects,
        } as any);
      }

      const adminUpdateData = {
        grade: cleanGrade,
        stream: cleanStream,
        subjects,
        assigned_classes: assignedClasses,
        target_university: defaultTargetUni,
        is_registered: true,
        updated_at: new Date().toISOString(),
      };

      const db = getSupabaseAdminClient() || getAuthClient(req) || supabaseServer;
      let updateRes: any = null;

      if (db) {
        if (!targetId && targetEmail) {
          try {
            const { data: sRow } = await db.from("students").select("id").ilike("email", targetEmail).maybeSingle();
            if (sRow?.id) targetId = sRow.id;
          } catch (e: any) {
            console.warn("[api/admin/update-student-grade-stream] Warning resolving targetId:", e?.message);
          }
        }

        if (targetId && !targetId.includes("@")) {
          updateRes = await db
            .from("students")
            .update(adminUpdateData)
            .eq("id", targetId)
            .select()
            .maybeSingle();

          if (updateRes?.error && (updateRes.error.message?.includes("column") || updateRes.error.code === "PGRST204")) {
            updateRes = await db
              .from("students")
              .update({
                grade: cleanGrade,
                stream: cleanStream,
                is_registered: true,
                updated_at: new Date().toISOString(),
              })
              .eq("id", targetId)
              .select()
              .maybeSingle();
          }
        }

        // Fallback: try matching by email if id query failed or returned no rows
        if ((!updateRes || updateRes.error || !updateRes.data) && targetEmail) {
          updateRes = await db
            .from("students")
            .update(adminUpdateData)
            .ilike("email", targetEmail)
            .select()
            .maybeSingle();

          if (updateRes?.error && (updateRes.error.message?.includes("column") || updateRes.error.code === "PGRST204")) {
            updateRes = await db
              .from("students")
              .update({
                grade: cleanGrade,
                stream: cleanStream,
                is_registered: true,
                updated_at: new Date().toISOString(),
              })
              .ilike("email", targetEmail)
              .select()
              .maybeSingle();
          }
        }

        // If no rows were updated in students table yet, upsert to establish student profile
        if (!updateRes?.data && (targetId || targetEmail)) {
          const finalId = targetId || ("student_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6));
          const finalEmail = targetEmail || "";
          const upsertPayload: any = {
            id: finalId,
            email: finalEmail,
            name: studentName || (finalEmail ? finalEmail.split("@")[0] : "Student"),
            grade: cleanGrade,
            stream: cleanStream,
            subjects,
            assigned_classes: assignedClasses,
            target_university: defaultTargetUni,
            is_registered: true,
            status: "active",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          const upsertRes = await db.from("students").upsert(upsertPayload).select().maybeSingle();
          if (upsertRes?.data) {
            updateRes = upsertRes;
          } else if (upsertRes?.error && (upsertRes.error.message?.includes("column") || upsertRes.error.code === "PGRST204")) {
            const minimalUpsert = {
              id: finalId,
              email: finalEmail,
              name: studentName || (finalEmail ? finalEmail.split("@")[0] : "Student"),
              grade: cleanGrade,
              stream: cleanStream,
              is_registered: true,
              status: "active",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            updateRes = await db.from("students").upsert(minimalUpsert).select().maybeSingle();
          }
        }
      }

      const returnedProfile = updateRes?.data || {
        id: targetId || (targetEmail ? targetEmail.split("@")[0] : "student"),
        email: targetEmail || "",
        name: studentName || (targetEmail ? targetEmail.split("@")[0] : "Student"),
        grade: cleanGrade,
        stream: cleanStream,
        subjects,
        assigned_classes: assignedClasses,
        target_university: defaultTargetUni,
        is_registered: true,
        status: "active",
        updated_at: new Date().toISOString(),
      };

      return res.json({
        success: true,
        profile: returnedProfile,
      });
    } catch (err: any) {
      console.error("Payload:", req.body);
      console.error("Database Error / Exception:", err);
      return res.status(500).json({ success: false, error: err?.message || "Failed to update grade/stream" });
    }
  });

  // API Endpoint: Update Student Target University in Supabase Postgres
  app.post("/api/student/update-target-university", async (req, res) => {
    try {
      const { userId, userEmail, targetUniversity } = req.body || {};
      const uni = (targetUniversity || "").toString().trim();

      if (!userId && !userEmail) {
        return res.status(400).json({ success: false, error: "userId or userEmail required" });
      }

      const db = getSupabaseAdminClient() || getAuthClient(req) || supabaseServer;
      if (!db) {
        return res.status(500).json({ success: false, error: "Database unavailable" });
      }

      let updateRes: any = null;
      const nowIso = new Date().toISOString();

      if (userId) {
        updateRes = await db
          .from("students")
          .update({
            dream_university: uni,
            target_university: uni,
            updated_at: nowIso,
          })
          .eq("id", userId)
          .select()
          .maybeSingle();
      }

      if ((!updateRes || updateRes.error || !updateRes.data) && userEmail) {
        updateRes = await db
          .from("students")
          .update({
            dream_university: uni,
            target_university: uni,
            updated_at: nowIso,
          })
          .eq("email", userEmail)
          .select()
          .maybeSingle();
      }

      // If no row existed or update returned empty/error, attempt upsert
      if (!updateRes || updateRes.error || !updateRes.data) {
        const idToUse = userId || (updateRes?.data?.id);
        if (idToUse) {
          updateRes = await db
            .from("students")
            .upsert({
              id: idToUse,
              email: userEmail || "",
              name: (userEmail || "").split("@")[0] || "Student",
              dream_university: uni,
              target_university: uni,
              updated_at: nowIso,
            })
            .select()
            .maybeSingle();
        }
      }

      if (updateRes && updateRes.error) {
        console.error("[/api/student/update-target-university] Supabase write error:", updateRes.error.message);
        return res.status(500).json({
          success: false,
          error: updateRes.error.message || "Database update failed",
        });
      }

      if (!updateRes || !updateRes.data) {
        return res.status(500).json({
          success: false,
          error: "Failed to persist target university to database row",
        });
      }

      return res.json({
        success: true,
        target_university: uni,
        profile: updateRes.data,
      });
    } catch (err: any) {
      console.error("[/api/student/update-target-university] Error:", err);
      return res.status(500).json({ success: false, error: err?.message || "Failed to update target university" });
    }
  });

  // API Endpoint: Update Student Personal Info (Name & Phone) in Supabase Postgres
  app.post("/api/student/update-personal-info", async (req, res) => {
    try {
      const { userId, userEmail, name, phone } = req.body || {};
      const cleanName = (name || "").toString().trim();
      const cleanPhone = (phone || "").toString().trim();

      if (!userId && !userEmail) {
        return res.status(400).json({ success: false, error: "userId or userEmail required" });
      }

      const db = getSupabaseAdminClient() || getAuthClient(req) || supabaseServer;
      if (!db) {
        return res.status(500).json({ success: false, error: "Database unavailable" });
      }

      let updateRes: any = null;
      const nowIso = new Date().toISOString();

      if (userId) {
        updateRes = await db
          .from("students")
          .update({
            name: cleanName,
            phone: cleanPhone,
            updated_at: nowIso,
          })
          .eq("id", userId)
          .select()
          .maybeSingle();
      }

      if ((!updateRes || updateRes.error || !updateRes.data) && userEmail) {
        updateRes = await db
          .from("students")
          .update({
            name: cleanName,
            phone: cleanPhone,
            updated_at: nowIso,
          })
          .eq("email", userEmail)
          .select()
          .maybeSingle();
      }

      // If no row existed or update returned empty/error, attempt upsert
      if (!updateRes || updateRes.error || !updateRes.data) {
        const idToUse = userId || (updateRes?.data?.id);
        if (idToUse) {
          updateRes = await db
            .from("students")
            .upsert({
              id: idToUse,
              email: userEmail || "",
              name: cleanName || "Student",
              phone: cleanPhone,
              updated_at: nowIso,
            })
            .select()
            .maybeSingle();
        }
      }

      if (updateRes && updateRes.error) {
        console.error("[/api/student/update-personal-info] Supabase write error:", updateRes.error.message);
        return res.status(500).json({
          success: false,
          error: updateRes.error.message || "Database update failed",
        });
      }

      if (!updateRes || !updateRes.data) {
        return res.status(500).json({
          success: false,
          error: "Failed to persist personal info to database row",
        });
      }

      return res.json({
        success: true,
        profile: updateRes.data,
      });
    } catch (err: any) {
      console.error("[/api/student/update-personal-info] Error:", err);
      return res.status(500).json({ success: false, error: err?.message || "Failed to update personal info" });
    }
  });

  // API Endpoint: Admin Remove Student (Full Account Wipe)
  app.all("/api/admin/remove-student", async (req, res) => {
    if (req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "POST, DELETE, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
      return res.status(204).end();
    }

    try {
      const { user, isAdmin } = await verifyAuthToken(req);
      if (!user || !isAdmin) {
        return res.status(403).json({
          success: false,
          error: "Forbidden: Only administrators can wipe student accounts.",
        });
      }

      const studentId = req.body?.studentId || req.query?.studentId || "";
      const studentEmail = req.body?.studentEmail || req.query?.studentEmail || "";

      if (!studentId && !studentEmail) {
        return res.status(400).json({
          success: false,
          error: "Missing parameters: studentId or studentEmail is required.",
        });
      }

      console.log(`[api/admin/remove-student] Initiating full wipe for studentId="${studentId}", email="${studentEmail}" by admin="${user.email}"`);

      const db = getSupabaseAdminClient() || supabaseServer;
      const errors: string[] = [];

      let targetStudentId = studentId;
      let targetStudentEmail = studentEmail;

      if (db) {
        // Resolve studentId or studentEmail if missing
        if (!targetStudentId && targetStudentEmail) {
          try {
            const { data: sData } = await db.from("students").select("id").eq("email", targetStudentEmail).maybeSingle();
            if (sData?.id) targetStudentId = sData.id;
          } catch (rErr: any) {
            console.warn(`[api/admin/remove-student] Warning resolving studentId by email:`, rErr?.message);
          }
        }
        if (!targetStudentEmail && targetStudentId) {
          try {
            const { data: sData } = await db.from("students").select("email").eq("id", targetStudentId).maybeSingle();
            if (sData?.email) targetStudentEmail = sData.email;
          } catch (rErr: any) {
            console.warn(`[api/admin/remove-student] Warning resolving studentEmail by id:`, rErr?.message);
          }
        }

        // Step 1: Delete from related child tables first to prevent FK constraint issues
        const childTasks: Array<{ table: string; field: string; val: string }> = [];

        if (targetStudentId) {
          childTasks.push(
            { table: "test_results", field: "student_id", val: targetStudentId },
            { table: "mcq_attempts", field: "student_id", val: targetStudentId },
            { table: "student_mcq_usage", field: "student_id", val: targetStudentId },
            { table: "mcq_usage", field: "student_id", val: targetStudentId },
            { table: "student_progress", field: "student_id", val: targetStudentId },
            { table: "ai_history", field: "student_id", val: targetStudentId },
            { table: "study_buddy_history", field: "student_id", val: targetStudentId },
            { table: "study_buddy_usage", field: "student_id", val: targetStudentId },
            { table: "student_achievements", field: "student_id", val: targetStudentId },
            { table: "achievements", field: "student_id", val: targetStudentId }
          );
        }

        if (targetStudentEmail) {
          childTasks.push(
            { table: "student_mcq_usage", field: "email", val: targetStudentEmail },
            { table: "mcq_usage", field: "email", val: targetStudentEmail }
          );
        }

        for (const task of childTasks) {
          try {
            const { error } = await db.from(task.table).delete().eq(task.field, task.val);
            if (error) {
              console.warn(`[api/admin/remove-student] Warning clearing ${task.table} (${task.field}=${task.val}):`, error.message);
              errors.push(`${task.table}: ${error.message}`);
            } else {
              console.log(`[api/admin/remove-student] Cleared ${task.table} (${task.field}=${task.val})`);
            }
          } catch (tErr: any) {
            console.warn(`[api/admin/remove-student] Exception deleting ${task.table}:`, tErr?.message || String(tErr));
          }
        }

        // Step 2: Delete from main 'students' table
        if (targetStudentId) {
          try {
            const { error } = await db.from("students").delete().eq("id", targetStudentId);
            if (error) {
              console.error(`[api/admin/remove-student] Error deleting student row (id=${targetStudentId}):`, error.message);
              errors.push(`students(id): ${error.message}`);
            } else {
              console.log(`[api/admin/remove-student] Successfully deleted student row (id=${targetStudentId})`);
            }
          } catch (sErr: any) {
            console.error(`[api/admin/remove-student] Exception deleting student row (id=${targetStudentId}):`, sErr?.message);
          }
        }

        if (targetStudentEmail) {
          try {
            const { error } = await db.from("students").delete().eq("email", targetStudentEmail);
            if (error) {
              console.warn(`[api/admin/remove-student] Warning deleting student row by email (${targetStudentEmail}):`, error.message);
            } else {
              console.log(`[api/admin/remove-student] Successfully deleted student row (email=${targetStudentEmail})`);
            }
          } catch (seErr: any) {
            console.warn(`[api/admin/remove-student] Exception deleting student row by email:`, seErr?.message);
          }
        }

        // Step 3: Revoke all active Supabase sessions server-side and delete auth user
        const adminClient = getSupabaseAdminClient();
        if (adminClient && targetStudentId && (adminClient as any).auth?.admin) {
          try {
            if (typeof (adminClient as any).auth.admin.signOut === 'function') {
              await (adminClient as any).auth.admin.signOut(targetStudentId, 'global');
              console.log(`[api/admin/remove-student] Revoked all sessions/JWTs for user (${targetStudentId})`);
            }
          } catch (soErr: any) {
            console.warn(`[api/admin/remove-student] Auth admin signOut warning:`, soErr?.message);
          }
          try {
            const { error: authErr } = await (adminClient as any).auth.admin.deleteUser(targetStudentId);
            if (authErr) {
              console.warn(`[api/admin/remove-student] Auth admin delete warning:`, authErr.message);
            } else {
              console.log(`[api/admin/remove-student] Deleted auth user (${targetStudentId}) from Supabase Auth`);
            }
          } catch (aErr: any) {
            console.warn(`[api/admin/remove-student] Exception deleting auth user:`, aErr?.message);
          }
        }
      }

      return res.status(200).json({
        success: true,
        message: "Student account, test history, and registration wiped successfully.",
        warnings: errors.length > 0 ? errors : undefined,
      });
    } catch (err: any) {
      console.error("[api/admin/remove-student exception]:", err);
      return res.status(500).json({
        success: false,
        error: err?.message || "Failed to remove student account",
      });
    }
  });

  // API Endpoint: Admin Update Student Status (Suspend / Reactivate)
  app.all("/api/admin/update-student-status", async (req, res) => {
    if (req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "POST, PATCH, PUT, DELETE, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
      return res.status(204).end();
    }
    const { requesterEmail, studentId, status } = req.body;

    const { user: tokenUser, isAdmin: isTokenAdmin } = await verifyAuthToken(req);
    const requestedBy = requesterEmail || tokenUser?.email || '';
    const isAdmin = isTokenAdmin || isAdminEmail(requestedBy);

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: "Forbidden: Only administrators can change student status.",
      });
    }

    if (!studentId || !status || !['active', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Missing or invalid parameters: studentId and valid status ('active' or 'suspended') are required.",
      });
    }

    try {
      if (getAuthClient(req || null)) {
        const updateRes = await supabaseServer
          .from("students")
          .update({
            status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", studentId)
          .select()
          .maybeSingle();

        if (updateRes.error) {
          console.error("[api/admin/update-student-status error]:", updateRes.error);
          return res.status(500).json({ success: false, error: updateRes.error.message });
        }

        return res.json({ success: true, status, profile: updateRes.data });
      }

      return res.json({ success: true, status });
    } catch (err: any) {
      console.error("[api/admin/update-student-status exception]:", err);
      return res.status(500).json({
        success: false,
        error: err?.message || "Failed to update student status",
      });
    }
  });

  // API Endpoint: Admin Fetch All Students (Supabase + In-Memory merge)
  app.get("/api/admin/all-students", async (req, res) => {
    try {
      const studentMap = new Map<string, any>();

      // 1. First add all baseline/in-memory students
      for (const s of inMemoryStudents) {
        studentMap.set(s.id, { ...s });
        studentMap.set(s.email.toLowerCase(), { ...s });
      }

      // 2. Query Supabase students table
      const supabaseAdmin = getSupabaseAdminClient() || supabaseServer;
      if (supabaseAdmin) {
        try {
          const { data, error } = await supabaseAdmin
            .from("students")
            .select("*")
            .order("created_at", { ascending: false });

          if (!error && Array.isArray(data)) {
            for (const row of data) {
              const id = row.id;
              const email = (row.email || "").toLowerCase();
              const existing = studentMap.get(id) || (email ? studentMap.get(email) : null);
              const merged = {
                id: row.id,
                name: row.name || row.full_name || existing?.name || (email ? email.split("@")[0] : "Student"),
                email: row.email || existing?.email || "",
                phone: row.phone || existing?.phone || "",
                grade: row.grade || row.class_grade || existing?.grade || "",
                stream: row.stream || row.group || existing?.stream || "",
                is_registered: Boolean(row.is_registered ?? existing?.is_registered ?? (row.grade && row.stream && row.grade !== "General Student")),
                is_pro: Boolean(row.is_pro ?? existing?.is_pro ?? false),
                package_name: row.package_name || existing?.package_name || (row.is_pro ? "Pro Plan" : "Free"),
                subscribed_plans: Array.isArray(row.subscribed_plans) ? row.subscribed_plans : (existing?.subscribed_plans || []),
                assigned_classes: Array.isArray(row.assigned_classes) ? row.assigned_classes : (existing?.assigned_classes || []),
                subjects: Array.isArray(row.subjects) ? row.subjects : (existing?.subjects || []),
                target_university: row.target_university || existing?.target_university || "",
                sign_up_method: row.sign_up_method || existing?.sign_up_method || "Email/Password",
                payment_status: row.payment_status || existing?.payment_status || (row.is_pro ? "approved" : "free"),
                status: row.status || existing?.status || "active",
                tests_used_this_month: Number(row.tests_used_this_month ?? row.mcq_count_this_month ?? existing?.tests_used_this_month ?? 0),
                created_at: row.created_at || existing?.created_at || new Date().toISOString(),
                updated_at: row.updated_at || existing?.updated_at || new Date().toISOString(),
              };
              studentMap.set(id, merged);
              if (email) studentMap.set(email, merged);
            }
          }
        } catch (dbErr) {
          console.warn("[/api/admin/all-students db warning]:", dbErr);
        }
      }

      // 3. Ensure any student with test results is also represented
      for (const t of inMemoryTestResults) {
        const id = t.student_id;
        const email = (t.student_email || "").toLowerCase();
        if (!studentMap.has(id) && (!email || !studentMap.has(email))) {
          const newStudent = {
            id,
            name: t.student_name || (email ? email.split("@")[0] : `Student (${id.substring(0, 8)})`),
            email: t.student_email || "",
            phone: "",
            grade: t.path_label?.includes("TCAT") ? "TCAT" : "MDCAT",
            stream: t.path_label || "Exam Standard",
            is_registered: true,
            is_pro: true,
            package_name: "Pro Prep",
            subscribed_plans: [t.path_label || "Exam Prep"],
            payment_status: "approved",
            status: "active",
            tests_used_this_month: 1,
            created_at: t.created_at,
            updated_at: t.created_at,
          };
          studentMap.set(id, newStudent);
          if (email) studentMap.set(email, newStudent);
        }
      }

      // Return unique list deduplicated by id
      const uniqueStudents = Array.from(
        new Map(Array.from(studentMap.values()).map(s => [s.id, s])).values()
      );

      // Read attempt counts from the exact same source of truth the student dashboard uses (getStudentMonthlyTestCount)
      await Promise.all(
        uniqueStudents.map(async (st) => {
          try {
            const count = await getStudentMonthlyTestCount(st.id, st.email, req);
            st.tests_used_this_month = Math.max(count, Number(st.tests_used_this_month || 0));
          } catch (cntErr) {
            st.tests_used_this_month = Number(st.tests_used_this_month || 0);
          }
        })
      );

      uniqueStudents.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return res.json({ success: true, students: uniqueStudents });
    } catch (err: any) {
      console.error("[api/admin/all-students error]:", err);
      return res.status(500).json({ success: false, error: err?.message || "Failed to fetch students" });
    }
  });

  // API Endpoint: Admin Fetch All Study Buddy History (Supabase + In-Memory)
  app.get("/api/admin/all-study-buddy-history", async (req, res) => {
    try {
      const logsMap = new Map<string, any>();

      // 1. In-memory logs
      for (const log of inMemoryStudyBuddyLogs) {
        logsMap.set(log.id, { ...log });
      }

      // 2. Query Supabase study_buddy_history table
      const supabaseAdmin = getSupabaseAdminClient() || supabaseServer;
      if (supabaseAdmin) {
        try {
          const { data, error } = await supabaseAdmin
            .from("study_buddy_history")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(500);

          if (!error && Array.isArray(data)) {
            for (const row of data) {
              logsMap.set(String(row.id), {
                id: String(row.id),
                student_id: row.student_id || "",
                student_name: row.student_name || "",
                student_email: row.student_email || "",
                role: row.role || "user",
                message_text: row.message_text || row.cleanText || "",
                created_at: row.created_at || new Date().toISOString(),
                conversation_id: row.conversation_id || undefined,
              });
            }
          }
        } catch (dbErr) {
          console.warn("[/api/admin/all-study-buddy-history db warning]:", dbErr);
        }
      }

      const allLogs = Array.from(logsMap.values());
      allLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return res.json({ success: true, history: allLogs });
    } catch (err: any) {
      console.error("[api/admin/all-study-buddy-history error]:", err);
      return res.status(500).json({ success: false, error: err?.message || "Failed to fetch study buddy history" });
    }
  });

  // API Endpoint: Log a Study Buddy message (Client or Server interaction)
  app.post("/api/study-buddy/log-message", async (req, res) => {
    try {
      const { studentId, studentName, studentEmail, role = 'user', messageText, conversationId } = req.body || {};
      if (!messageText) {
        return res.status(400).json({ success: false, error: "Missing messageText" });
      }

      const cleanText = String(messageText).trim();
      const targetRole = role === 'model' ? 'model' : 'user';

      // Deduplicate if already logged by stream within last 15 seconds
      const isDuplicate = inMemoryStudyBuddyLogs.some(
        (l) =>
          l.role === targetRole &&
          l.message_text.trim() === cleanText &&
          Math.abs(Date.now() - new Date(l.created_at).getTime()) < 15000
      );
      if (isDuplicate) {
        return res.json({ success: true, message: "Already logged" });
      }

      const newLogItem: ServerStudyBuddyLogItem = {
        id: `sb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        student_id: studentId || "anonymous",
        student_name: studentName || studentEmail || "Student",
        student_email: studentEmail || "",
        role: targetRole,
        message_text: cleanText,
        created_at: new Date().toISOString(),
        conversation_id: conversationId || undefined,
      };

      inMemoryStudyBuddyLogs.unshift(newLogItem);
      if (inMemoryStudyBuddyLogs.length > 500) {
        inMemoryStudyBuddyLogs.pop();
      }
      savePersistentStudyBuddyLogs();

      // Also try writing to Supabase
      const supabaseAdmin = getSupabaseAdminClient() || supabaseServer;
      if (supabaseAdmin) {
        supabaseAdmin.from("study_buddy_history").insert({
          student_id: studentId || null,
          role: newLogItem.role,
          message_text: newLogItem.message_text,
          conversation_id: conversationId || null,
          created_at: newLogItem.created_at,
        }).catch((err: any) => console.warn("[study-buddy/log-message Supabase insert warning]:", err?.message));
      }

      return res.json({ success: true, logItem: newLogItem });
    } catch (err: any) {
      console.error("[api/study-buddy/log-message error]:", err);
      return res.status(500).json({ success: false, error: err?.message || "Failed to log message" });
    }
  });


  // API Endpoint: Get Site Settings (Public)
  const handleGetSiteSettings = async (req: express.Request, res: express.Response) => {
    try {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
      if (req.method === "OPTIONS") {
        return res.status(204).end();
      }
      res.setHeader("Content-Type", "application/json");
      return res.status(200).json({ success: true, settings: { logo_url: "" } });
    } catch (err: any) {
      res.setHeader("Content-Type", "application/json");
      return res.status(200).json({ success: true, settings: { logo_url: "" } });
    }
  };

  app.all("/api/site-settings", handleGetSiteSettings);
  app.all("/api/settings/site", handleGetSiteSettings);

  // --- RESOURCES HUB ENDPOINTS (Past Papers & MCQ Drills) ---
  const resourceUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
  });

  function parseAssignedClassesServer(record: any): string[] {
    const allowed = new Set<string>();
    if (!record) return [];

    // Check assigned_classes array
    let assignedArr: string[] = [];
    if (Array.isArray(record.assigned_classes)) {
      assignedArr = record.assigned_classes;
    } else if (typeof record.assigned_classes === "string" && record.assigned_classes.trim()) {
      try {
        const parsed = JSON.parse(record.assigned_classes);
        assignedArr = Array.isArray(parsed) ? parsed : [record.assigned_classes];
      } catch {
        assignedArr = [record.assigned_classes];
      }
    }

    assignedArr.forEach((c) => {
      const cStr = String(c).trim().toUpperCase();
      if (cStr.includes("MDCAT")) allowed.add("MDCAT");
      else if (cStr.includes("TCAT") || cStr.includes("UET TAXILA")) allowed.add("TCAT");
      else if (cStr.includes("NET") || cStr.includes("NUST")) allowed.add("NET");
      else if (cStr.includes("FAST")) allowed.add("FAST");
      else if (cStr.includes("NAT") || cStr.includes("NTS")) allowed.add("NAT");
      else if (cStr.includes("ECAT") || cStr.includes("UET LAHORE")) allowed.add("ECAT");
      else if (cStr.includes("ETEA") || cStr.includes("UET PESHAWAR")) allowed.add("ETEA");
      else if (cStr.includes("NUMS")) allowed.add("NUMS");
      else if (cStr.includes("GIKI")) allowed.add("GIKI");
      else if (cStr.includes("USAT")) allowed.add("USAT");
      else if (cStr.includes("NED")) allowed.add("NED");
      else if (cStr.includes("PIEAS")) allowed.add("PIEAS");
      else if (cStr.includes("IBA")) allowed.add("IBA");
      else if (cStr.includes("AKU") || cStr.includes("AGA KHAN")) allowed.add("AKU");
      else if (cStr.includes("MUET") || cStr.includes("MEHRAN")) allowed.add("MUET");
      else if (cStr.includes("LUMS")) allowed.add("LUMS");
      else if (cStr.includes("NUML")) allowed.add("NUML");
      else if (cStr.includes("HITEC")) allowed.add("HITEC");
      else if (cStr.includes("NUTECH") || cStr.includes("NUET")) allowed.add("NUTECH");
      else if (cStr.includes("9") || cStr.includes("NINTH")) allowed.add("Class 9");
      else if (cStr.includes("10") || cStr.includes("TENTH") || cStr.includes("MATRIC")) allowed.add("Class 10");
      else if (cStr.includes("11") || cStr.includes("FIRST") || cStr.includes("FSC 1")) allowed.add("Class 11");
      else if (cStr.includes("12") || cStr.includes("SECOND") || cStr.includes("FSC 2")) allowed.add("Class 12");
      else allowed.add(String(c).trim());
    });

    const gStr = String(record.grade || "").trim().toUpperCase();
    const sStr = String(record.stream || "").trim().toUpperCase();
    const pStr = String(record.package_name || "").trim().toUpperCase();
    const combined = `${gStr} ${sStr} ${pStr}`;

    if (combined.includes("MDCAT")) allowed.add("MDCAT");
    if (combined.includes("TCAT") || combined.includes("UET TAXILA")) allowed.add("TCAT");
    if (combined.includes("NET") || combined.includes("NUST")) allowed.add("NET");
    if (combined.includes("FAST")) allowed.add("FAST");
    if (combined.includes("NAT") || combined.includes("NTS")) allowed.add("NAT");
    if (combined.includes("ECAT") || combined.includes("UET LAHORE")) allowed.add("ECAT");
    if (combined.includes("ETEA") || combined.includes("UET PESHAWAR")) allowed.add("ETEA");
    if (combined.includes("NUMS")) allowed.add("NUMS");
    if (combined.includes("GIKI")) allowed.add("GIKI");
    if (combined.includes("USAT")) allowed.add("USAT");
    if (combined.includes("NED")) allowed.add("NED");
    if (combined.includes("PIEAS")) allowed.add("PIEAS");
    if (combined.includes("IBA")) allowed.add("IBA");
    if (combined.includes("AKU") || combined.includes("AGA KHAN")) allowed.add("AKU");
    if (combined.includes("MUET") || combined.includes("MEHRAN")) allowed.add("MUET");
    if (combined.includes("LUMS")) allowed.add("LUMS");
    if (combined.includes("NUML")) allowed.add("NUML");
    if (combined.includes("HITEC")) allowed.add("HITEC");
    if (combined.includes("NUTECH") || combined.includes("NUET")) allowed.add("NUTECH");
    if (gStr.includes("9") || gStr.includes("NINTH") || combined.includes("CLASS 9") || combined.includes("GRADE 9")) allowed.add("Class 9");
    if (gStr.includes("10") || gStr.includes("TENTH") || combined.includes("CLASS 10") || combined.includes("GRADE 10")) allowed.add("Class 10");
    if (gStr.includes("11") || gStr.includes("FIRST YEAR") || gStr.includes("FSC 1") || combined.includes("CLASS 11") || combined.includes("GRADE 11")) allowed.add("Class 11");
    if (gStr.includes("12") || gStr.includes("SECOND YEAR") || gStr.includes("FSC 2") || combined.includes("CLASS 12") || combined.includes("GRADE 12")) allowed.add("Class 12");

    if (allowed.size === 0) {
      if (gStr.includes("NET") || gStr.includes("NUST")) allowed.add("NET");
      else if (gStr.includes("FAST")) allowed.add("FAST");
      else if (gStr.includes("NAT") || gStr.includes("NTS")) allowed.add("NAT");
      else if (gStr.includes("ECAT")) allowed.add("ECAT");
      else if (gStr.includes("ETEA")) allowed.add("ETEA");
      else if (gStr.includes("NUMS")) allowed.add("NUMS");
      else if (gStr.includes("GIKI")) allowed.add("GIKI");
      else if (gStr.includes("USAT")) allowed.add("USAT");
      else if (gStr.includes("NED")) allowed.add("NED");
      else if (gStr.includes("PIEAS")) allowed.add("PIEAS");
      else if (gStr.includes("IBA")) allowed.add("IBA");
      else if (gStr.includes("AKU") || gStr.includes("AGA KHAN")) allowed.add("AKU");
      else if (gStr.includes("MUET") || gStr.includes("MEHRAN")) allowed.add("MUET");
      else if (gStr.includes("LUMS")) allowed.add("LUMS");
      else if (gStr.includes("NUML")) allowed.add("NUML");
      else if (gStr.includes("HITEC")) allowed.add("HITEC");
      else if (gStr.includes("NUTECH") || gStr.includes("NUET")) allowed.add("NUTECH");
      else if (gStr.includes("MDCAT")) allowed.add("MDCAT");
      else if (gStr.includes("TCAT")) allowed.add("TCAT");
      else if (gStr.includes("9")) allowed.add("Class 9");
      else if (gStr.includes("10")) allowed.add("Class 10");
      else if (gStr.includes("11")) allowed.add("Class 11");
      else if (gStr.includes("12")) allowed.add("Class 12");
    }

    return Array.from(allowed);
  }

  app.get("/api/resources", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const classFilter = req.query.class as string | undefined;
      const queryEmail = (req.query.studentEmail as string || "").trim().toLowerCase();
      const queryGrade = (req.query.grade as string || "").trim();
      const queryStream = (req.query.stream as string || "").trim();

      const { user: tokenUser, isAdmin: isTokenAdmin } = await verifyAuthToken(req);
      const resolvedEmail = (tokenUser?.email || queryEmail).trim().toLowerCase();
      const isAdmin = isTokenAdmin || (resolvedEmail ? isAdminEmail(resolvedEmail) : false);

      const db = getSupabaseAdminClient() || supabaseServer;
      if (!db) {
        return res.json({ success: true, resources: [] });
      }

      // Determine student allowed classes
      let allowedClasses: string[] | null = null;
      if (!isAdmin) {
        let studentRecord: any = null;
        if (resolvedEmail || tokenUser?.id) {
          try {
            let sQuery = db.from("students").select("id, email, grade, stream, assigned_classes, package_name, subscribed_plans, is_pro, payment_status");
            if (tokenUser?.id) {
              sQuery = sQuery.or(`id.eq.${tokenUser.id},email.eq.${resolvedEmail}`);
            } else if (resolvedEmail) {
              sQuery = sQuery.eq("email", resolvedEmail);
            }
            const { data: sData } = await sQuery.maybeSingle();
            studentRecord = sData;
          } catch (stErr) {
            console.warn("[api/resources student lookup warning]:", stErr);
          }
        }

        if (!studentRecord && (queryGrade || queryStream)) {
          studentRecord = { grade: queryGrade, stream: queryStream };
        }

        if (studentRecord) {
          allowedClasses = parseAssignedClassesServer(studentRecord);
        }
      }

      let query = db.from("resources").select("*").order("created_at", { ascending: false });
      if (category) {
        query = query.eq("category", category);
      }

      // Server-side enforcement: If student is not admin and has allowedClasses, enforce class restrictions
      if (!isAdmin && allowedClasses && allowedClasses.length > 0) {
        if (classFilter && classFilter !== "All" && classFilter !== "all" && classFilter !== "All Classes" && classFilter !== "All My Classes") {
          const isMatch = allowedClasses.some(ac => ac.toLowerCase() === classFilter.toLowerCase());
          if (!isMatch) {
            return res.status(403).json({
              success: false,
              error: `Access Denied: You are not assigned to ${classFilter}.`,
              resources: [],
            });
          }
          query = query.eq("class", classFilter);
        } else {
          const filterClasses = [...allowedClasses, "All", "all", "All Classes", "General"];
          query = query.in("class", filterClasses);
        }
      } else if (classFilter && classFilter !== "All" && classFilter !== "all" && classFilter !== "All Classes" && classFilter !== "All My Classes") {
        query = query.eq("class", classFilter);
      }

      const { data, error } = await query;
      if (error) {
        console.error("[api/resources error]:", error);
        return res.json({ success: true, resources: [] });
      }

      let filteredData = data || [];
      if (!isAdmin && allowedClasses && allowedClasses.length > 0) {
        filteredData = filteredData.filter((item: any) => {
          const itemClass = (item.class || "").trim();
          if (itemClass.toLowerCase() === "all" || itemClass.toLowerCase() === "all classes" || itemClass.toLowerCase() === "general") {
            return true;
          }
          return allowedClasses!.some(ac => ac.toLowerCase() === itemClass.toLowerCase() || itemClass.toLowerCase().includes(ac.toLowerCase()));
        });
      }

      return res.json({ success: true, resources: filteredData });
    } catch (err: any) {
      console.error("[api/resources exception]:", err);
      return res.status(500).json({ success: false, error: err.message, resources: [] });
    }
  });

  app.post("/api/resources/upload", resourceUpload.single("file") as any, async (req: any, res: any) => {
    try {
      const { title, subject, class: targetClass, category, requesterEmail } = req.body || {};
      const file = req.file;

      const { user: tokenUser, isAdmin: isTokenAdmin } = await verifyAuthToken(req as any);
      const requestedBy = (requesterEmail || tokenUser?.email || "").trim().toLowerCase();
      const isAdmin = isTokenAdmin || isAdminEmail(requestedBy);

      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          error: "Unauthorized: Only administrators can upload resources.",
        });
      }

      if (!file) {
        return res.status(400).json({
          success: false,
          error: "Missing file: Please attach a PDF document.",
        });
      }

      if (!title || !title.trim()) {
        return res.status(400).json({
          success: false,
          error: "Document title is required.",
        });
      }

      const cleanCategory = category === "mcq_drill" ? "mcq_drill" : "past_paper";
      const sanitizedFileName = (file.originalname || "document.pdf").replace(/[^a-zA-Z0-9.-]/g, "_");
      const timestamp = Date.now();
      const objectKey = `resources/${cleanCategory}/${timestamp}-${sanitizedFileName}`;

      const formatBytes = (bytes: number, decimals = 1): string => {
        if (!bytes || bytes === 0) return "0 B";
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
      };

      const fileSizeFormatted = formatBytes(file.size);

      // Compute public R2 domain
      const publicDomain = (
        getEnvVar("PUBLIC_R2_DOMAIN") ||
        getEnvVar("R2_PUBLIC_DOMAIN") ||
        getEnvVar("VITE_R2_PUBLIC_DOMAIN") ||
        "pub-51ccade1f191417389ac7df61830c670.r2.dev"
      ).replace(/\/$/, "");

      const fileUrl = publicDomain.startsWith("http")
        ? `${publicDomain}/${objectKey}`
        : `https://${publicDomain}/${objectKey}`;

      const newResource = {
        title: title.trim(),
        subject: (subject || "General").trim(),
        class: (targetClass || "All").trim(),
        category: cleanCategory,
        file_url: fileUrl,
        file_size: fileSizeFormatted,
        uploaded_by: requestedBy,
        created_at: new Date().toISOString(),
      };

      const db = getSupabaseAdminClient() || supabaseServer;
      let savedResource: any = null;

      if (db) {
        const { data, error } = await db.from("resources").insert([newResource]).select().single();
        if (error) {
          console.error("[api/resources/upload Supabase error]:", error);
        } else {
          savedResource = data;
        }
      }

      return res.json({
        success: true,
        resource: savedResource || {
          id: `res-${timestamp}`,
          ...newResource,
        },
      });
    } catch (err: any) {
      console.error("[api/resources/upload exception]:", err);
      return res.status(500).json({
        success: false,
        error: err?.message || "Failed to upload resource.",
      });
    }
  });

  app.post("/api/resources/delete", async (req, res) => {
    try {
      const { id, requesterEmail } = req.body || {};

      const { user: tokenUser, isAdmin: isTokenAdmin } = await verifyAuthToken(req);
      const requestedBy = (requesterEmail || tokenUser?.email || "").trim().toLowerCase();
      const isAdmin = isTokenAdmin || isAdminEmail(requestedBy);

      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          error: "Unauthorized: Only administrators can delete resources.",
        });
      }

      if (!id) {
        return res.status(400).json({
          success: false,
          error: "Resource ID is required.",
        });
      }

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id).trim());
      const db = getSupabaseAdminClient() || supabaseServer;
      if (db && isUuid) {
        try {
          const { error } = await db.from("resources").delete().eq("id", id);
          if (error && !error.message?.includes("invalid input syntax for type uuid")) {
            return res.status(500).json({ success: false, error: error.message });
          }
        } catch (dbErr: any) {
          console.warn("[api/resources/delete db error ignored]:", dbErr?.message);
        }
      }

      return res.json({ success: true, message: "Resource deleted successfully." });
    } catch (err: any) {
      console.error("[api/resources/delete exception]:", err);
      return res.status(500).json({
        success: false,
        error: err?.message || "Failed to delete resource.",
      });
    }
  });

  // User Profile Picture (PFP) Upload with Cloudflare R2 & Local Fallback Storage
  const AVATARS_DIR = path.join(process.cwd(), "data", "avatars");
  if (!fs.existsSync(AVATARS_DIR)) {
    fs.mkdirSync(AVATARS_DIR, { recursive: true });
  }

  let r2ClientInstance: S3Client | null = null;
  function getR2Client(): S3Client | null {
    if (r2ClientInstance) return r2ClientInstance;
    const accountId = getEnvVar("R2_ACCOUNT_ID") || getEnvVar("CLOUDFLARE_ACCOUNT_ID") || getEnvVar("ACCOUNT_ID");
    const accessKeyId = getEnvVar("R2_ACCESS_KEY_ID") || getEnvVar("AWS_ACCESS_KEY_ID") || getEnvVar("CLOUDFLARE_R2_ACCESS_KEY_ID");
    const secretAccessKey = getEnvVar("R2_SECRET_ACCESS_KEY") || getEnvVar("AWS_SECRET_ACCESS_KEY") || getEnvVar("CLOUDFLARE_R2_SECRET_ACCESS_KEY");

    if (!accountId || !accessKeyId || !secretAccessKey) {
      return null;
    }

    try {
      r2ClientInstance = new S3Client({
        region: "auto",
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      return r2ClientInstance;
    } catch (err) {
      console.warn("[getR2Client error]:", err);
      return null;
    }
  }

  const avatarUploadMulter = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB max
    },
    fileFilter: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (file.mimetype === "image/svg+xml" || ext === ".svg") {
        return cb(new Error("SVG avatar uploads are disabled for security reasons. Please upload a PNG, JPG, WebP, or AVIF image."));
      }
      const allowedMimes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
        "image/avif",
      ];
      if (!allowedMimes.includes(file.mimetype)) {
        return cb(new Error("Invalid file format. Please upload a raster image file (JPEG, PNG, WebP, GIF, AVIF)."));
      }
      cb(null, true);
    },
  });

  // Serve locally cached avatar files with high-availability caching
  app.get("/api/avatar-file/:filename", (req, res) => {
    const filename = path.basename(req.params.filename);
    const ext = path.extname(filename).toLowerCase();
    if (ext === ".svg") {
      return res.status(403).send("SVG avatars are prohibited.");
    }
    const filePath = path.join(AVATARS_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).send("Avatar image not found");
    }
    res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Security-Policy", "default-src 'none'");
    const mimeTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".gif": "image/gif",
      ".avif": "image/avif",
    };
    if (mimeTypes[ext]) {
      res.setHeader("Content-Type", mimeTypes[ext]);
    }
    return res.sendFile(filePath);
  });

  app.options("/api/user/upload-avatar", (_req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "*");
    return res.status(204).end();
  });

  app.post("/api/user/upload-avatar", (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "*");
    (avatarUploadMulter.single("avatar") as any)(req, res, (err: any) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            error: "Image exceeds 5MB file limit. Please select a smaller photo.",
          });
        }
        return res.status(400).json({
          success: false,
          error: err.message || "Invalid image upload.",
        });
      }
      next();
    });
  }, async (req: express.Request, res: express.Response) => {
    try {
      const file = req.file;
      if (!file || !file.buffer || file.buffer.length === 0) {
        return res.status(400).json({
          success: false,
          error: "No image file provided. Please choose a picture to upload.",
        });
      }

      const { user: tokenUser } = await verifyAuthToken(req);
      const userId = (req.body.userId || tokenUser?.id || "").trim();
      const userEmail = (req.body.userEmail || tokenUser?.email || "").trim().toLowerCase();

      if (!userId && !userEmail) {
        return res.status(400).json({
          success: false,
          error: "User identification is required to update profile picture.",
        });
      }

      // Basic magic bytes validation for images
      const headerBytes = file.buffer.slice(0, 8);
      const isJpeg = headerBytes[0] === 0xff && headerBytes[1] === 0xd8;
      const isPng = headerBytes[0] === 0x89 && headerBytes[1] === 0x50 && headerBytes[2] === 0x4e && headerBytes[3] === 0x47;
      const isGif = headerBytes[0] === 0x47 && headerBytes[1] === 0x49 && headerBytes[2] === 0x46;
      const isWebp = file.mimetype === "image/webp" || file.originalname.toLowerCase().endsWith(".webp");
      const isAvif = file.mimetype === "image/avif" || file.originalname.toLowerCase().endsWith(".avif");

      if (!isJpeg && !isPng && !isGif && !isWebp && !isAvif && !file.mimetype.startsWith("image/")) {
        return res.status(400).json({
          success: false,
          error: "File does not appear to be a valid image. Please select a JPEG, PNG, or WebP photo.",
        });
      }

      let ext = path.extname(file.originalname).toLowerCase();
      if (!ext || ext === ".") {
        ext = isPng ? ".png" : isWebp ? ".webp" : isGif ? ".gif" : ".jpg";
      }

      const safeId = (userId || userEmail).replace(/[^a-zA-Z0-9_-]/g, "_");
      const timestamp = Date.now();
      const filename = `avatar-${safeId}-${timestamp}${ext}`;
      const objectKey = `avatars/${filename}`;

      // 1. Write file to local storage directory
      const localFilePath = path.join(AVATARS_DIR, filename);
      fs.writeFileSync(localFilePath, file.buffer);

      // 2. Upload to Cloudflare R2 via S3 API if credentials available
      let avatarUrl = "";
      const publicDomain = (
        getEnvVar("PUBLIC_R2_DOMAIN") ||
        getEnvVar("R2_PUBLIC_DOMAIN") ||
        getEnvVar("VITE_R2_PUBLIC_DOMAIN") ||
        "pub-51ccade1f191417389ac7df61830c670.r2.dev"
      ).replace(/\/$/, "");

      const r2PublicUrl = publicDomain.startsWith("http")
        ? `${publicDomain}/${objectKey}`
        : `https://${publicDomain}/${objectKey}`;

      const r2Client = getR2Client();
      const r2Bucket = getEnvVar("R2_AVATARS_BUCKET") || getEnvVar("R2_BUCKET_NAME") || getEnvVar("RESOURCES_BUCKET") || "boardly-resources";

      if (r2Client) {
        try {
          await r2Client.send(
            new PutObjectCommand({
              Bucket: r2Bucket,
              Key: objectKey,
              Body: file.buffer,
              ContentType: file.mimetype || "image/jpeg",
              Metadata: {
                userId: safeId,
                userEmail,
                uploadedAt: new Date().toISOString(),
              },
            })
          );
          avatarUrl = r2PublicUrl;
          console.log(`✅ [R2 Storage]: Successfully uploaded ${objectKey} to bucket ${r2Bucket}`);
        } catch (r2Err: any) {
          console.warn("[R2 S3 PutObject warning, fallback to local URL]:", r2Err?.message);
        }
      }

      if (!avatarUrl) {
        avatarUrl = `/api/avatar-file/${filename}`;
      }

      // 3. Update Database (students table) and Supabase Auth
      const db = getSupabaseAdminClient() || supabaseServer;
      let updatedProfile: any = null;

      if (db) {
        try {
          if (userId) {
            const { data, error } = await db
              .from("students")
              .update({
                avatar_url: avatarUrl,
                updated_at: new Date().toISOString(),
              })
              .eq("id", userId)
              .select("*")
              .maybeSingle();

            if (!error && data) {
              updatedProfile = data;
            } else if (error) {
              console.warn("[upload-avatar DB update id warning]:", error.message);
            }
          }

          if (!updatedProfile && userEmail) {
            const { data, error } = await db
              .from("students")
              .update({
                avatar_url: avatarUrl,
                updated_at: new Date().toISOString(),
              })
              .eq("email", userEmail)
              .select("*")
              .maybeSingle();

            if (!error && data) {
              updatedProfile = data;
            } else if (error) {
              console.warn("[upload-avatar DB update email warning]:", error.message);
            }
          }

          if (updatedProfile) {
            console.log("✅ [upload-avatar DB Update Success]:", {
              id: updatedProfile.id,
              name: updatedProfile.name,
              email: updatedProfile.email,
              avatar_url: updatedProfile.avatar_url,
            });
          } else {
            console.warn("⚠️ [upload-avatar DB]: No existing student row matched for update (userId:", userId, "userEmail:", userEmail, ")");
          }

          // Also update auth user metadata if admin client is available
          if (userId && (db as any).auth?.admin) {
            await (db as any).auth.admin.updateUserById(userId, {
              user_metadata: { avatar_url: avatarUrl, picture: avatarUrl },
            }).catch((authErr: any) => console.warn("[upload-avatar auth update warning]:", authErr.message));
          }
        } catch (dbErr: any) {
          console.warn("[upload-avatar DB update error]:", dbErr);
        }
      }

      return res.json({
        success: true,
        avatarUrl,
        profile: updatedProfile,
        message: "Profile picture updated successfully!",
      });
    } catch (err: any) {
      console.error("[api/user/upload-avatar exception]:", err);
      return res.status(500).json({
        success: false,
        error: err?.message || "Failed to upload profile picture.",
      });
    }
  });

  // Helper to check for private, local, and internal IPs/hostnames
  function isBlockedIpOrHost(hostname: string): boolean {
    const h = hostname.toLowerCase().trim();
    if (
      h === "localhost" ||
      h === "127.0.0.1" ||
      h === "::1" ||
      h === "0.0.0.0" ||
      h.endsWith(".local") ||
      h.endsWith(".internal") ||
      h.endsWith(".localhost") ||
      h.endsWith(".onion")
    ) {
      return true;
    }

    const ipv4Match = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
      const [, o1, o2, o3, o4] = ipv4Match.map(Number);
      if (o1 > 255 || o2 > 255 || o3 > 255 || o4 > 255) return true;
      if (o1 === 127) return true; // 127.0.0.0/8 loopback
      if (o1 === 10) return true;  // 10.0.0.0/8 private
      if (o1 === 172 && o2 >= 16 && o2 <= 31) return true; // 172.16.0.0/12 private
      if (o1 === 192 && o2 === 168) return true; // 192.168.0.0/16 private
      if (o1 === 169 && o2 === 254) return true; // 169.254.0.0/16 link-local / cloud metadata
      if (o1 === 0) return true;
      if (o1 === 100 && o2 >= 64 && o2 <= 127) return true; // CGNAT
    }

    if (h.includes(":") || h.startsWith("[") || h.endsWith("]")) {
      const cleanIpv6 = h.replace(/^\[|\]$/g, "").toLowerCase();
      if (
        cleanIpv6 === "::1" ||
        cleanIpv6 === "::" ||
        cleanIpv6.startsWith("fc") ||
        cleanIpv6.startsWith("fd") ||
        cleanIpv6.startsWith("fe80")
      ) {
        return true;
      }
    }

    return false;
  }

  function validateProxyUrl(urlString: string): { valid: boolean; error?: string } {
    try {
      const parsed = new URL(urlString);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        return { valid: false, error: "Only http and https protocols are permitted." };
      }

      if (isBlockedIpOrHost(parsed.hostname)) {
        return { valid: false, error: "Access to private or local network resources is strictly prohibited." };
      }

      const customR2Domain = (
        getEnvVar("PUBLIC_R2_DOMAIN") ||
        getEnvVar("R2_PUBLIC_DOMAIN") ||
        getEnvVar("VITE_R2_PUBLIC_DOMAIN") ||
        ""
      ).replace(/^https?:\/\//, "").replace(/\/.*$/, "").toLowerCase().trim();

      const allowedDomainSuffixes = [
        "r2.dev",
        "cloudflarestorage.com",
        "supabase.co",
        "supabase.in",
        "drive.google.com",
        "docs.google.com",
        "googleusercontent.com",
        "googleapis.com",
        "raw.githubusercontent.com",
        "github.com",
        "boardly.pk",
      ];

      if (customR2Domain) {
        allowedDomainSuffixes.push(customR2Domain);
      }

      const host = parsed.hostname.toLowerCase();
      const isAllowed = allowedDomainSuffixes.some(
        (suffix) => host === suffix || host.endsWith("." + suffix)
      );

      if (!isAllowed) {
        return {
          valid: false,
          error: `Host '${parsed.hostname}' is not in the permitted storage domain allowlist.`,
        };
      }

      return { valid: true };
    } catch {
      return { valid: false, error: "Malformed target URL format." };
    }
  }

  // Resource PDF Proxy & File Streaming Endpoint to fix R2 Cloud CORS & access issues
  const handleResourcePdfProxy = async (req: express.Request, res: express.Response) => {
    try {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "*");

      if (req.method === "OPTIONS") {
        return res.status(204).end();
      }

      const targetUrl = (req.query.url as string || "").trim();
      const fileKey = (req.query.key as string || "").trim();

      let fetchUrl = targetUrl;
      if (!fetchUrl && fileKey) {
        const publicDomain = (
          getEnvVar("PUBLIC_R2_DOMAIN") ||
          getEnvVar("R2_PUBLIC_DOMAIN") ||
          getEnvVar("VITE_R2_PUBLIC_DOMAIN") ||
          "pub-51ccade1f191417389ac7df61830c670.r2.dev"
        ).replace(/\/$/, "");
        fetchUrl = publicDomain.startsWith("http")
          ? `${publicDomain}/${fileKey}`
          : `https://${publicDomain}/${fileKey}`;
      }

      if (!fetchUrl) {
        return res.status(400).json({ success: false, error: "Missing 'url' or 'key' query parameter" });
      }

      // If relative URL starting with /api/resources/proxy, prevent loop
      if (fetchUrl.startsWith("/api/resources/proxy")) {
        const parsed = new URL(fetchUrl, "http://localhost:3000");
        fetchUrl = parsed.searchParams.get("url") || "";
      }

      if (!fetchUrl || !fetchUrl.startsWith("http")) {
        return res.status(400).json({ success: false, error: "Invalid target URL format" });
      }

      const validation = validateProxyUrl(fetchUrl);
      if (!validation.valid) {
        return res.status(403).json({
          success: false,
          error: validation.error || "Access to requested resource is restricted.",
        });
      }

      const forwardHeaders: Record<string, string> = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "*/*",
      };

      if (req.headers.range) {
        forwardHeaders["Range"] = req.headers.range as string;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      const upstreamResponse = await fetch(fetchUrl, {
        method: "GET",
        headers: forwardHeaders,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!upstreamResponse.ok && upstreamResponse.status !== 206) {
        console.warn(`[api/resources/proxy] Upstream fetch failed (${upstreamResponse.status}): ${fetchUrl}`);
        return res.status(upstreamResponse.status).json({
          success: false,
          error: `Upstream storage returned status ${upstreamResponse.status}: ${upstreamResponse.statusText}`,
        });
      }

      const contentType = upstreamResponse.headers.get("content-type") || "application/pdf";
      const contentLength = upstreamResponse.headers.get("content-length");
      const contentRange = upstreamResponse.headers.get("content-range");
      const acceptRanges = upstreamResponse.headers.get("accept-ranges");

      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Range, Authorization");
      res.setHeader("Content-Type", contentType.includes("pdf") ? "application/pdf" : contentType);
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.setHeader("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges");

      const isDownload = req.query.download === "1" || Boolean(req.query.filename);
      if (isDownload) {
        const rawFilename = (req.query.filename as string) || "document.pdf";
        let safeFilename = rawFilename.replace(/[/\\?%*:|"<>]/g, "_");
        if (!safeFilename.toLowerCase().endsWith(".pdf")) safeFilename += ".pdf";
        res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(safeFilename)}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`);
      } else {
        res.setHeader("Content-Disposition", "inline");
      }

      if (acceptRanges) res.setHeader("Accept-Ranges", acceptRanges);
      if (contentRange) res.setHeader("Content-Range", contentRange);
      if (contentLength) res.setHeader("Content-Length", contentLength);

      res.status(upstreamResponse.status);

      const arrayBuffer = await upstreamResponse.arrayBuffer();
      return res.send(Buffer.from(arrayBuffer));
    } catch (err: any) {
      console.error("[api/resources/proxy error]:", err);
      res.setHeader("Access-Control-Allow-Origin", "*");
      return res.status(500).json({
        success: false,
        error: err?.name === "AbortError" ? "Fetch timeout: Document storage took too long to respond." : (err?.message || "Failed to fetch PDF resource from storage."),
      });
    }
  };

  app.get("/api/resources/proxy", handleResourcePdfProxy);
  app.options("/api/resources/proxy", handleResourcePdfProxy);
  app.get("/api/resources/file", handleResourcePdfProxy);
  app.options("/api/resources/file", handleResourcePdfProxy);


  // API Endpoint: Get In-depth Explanation for a question
  app.post("/api/explain-mcq", async (req, res) => {
    const { question, options, selectedOption, correctOption, subject, topic } = req.body;

    // TCAT Explanations: Exclusively pull verified explanations from hardcoded bank, never invoke Gemini
    const isTcat = (subject && String(subject).toLowerCase().includes('tcat')) || (topic && String(topic).toLowerCase().includes('tcat'));
    const normQ = String(question || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const matchedTcat = ALL_TCAT_QUESTIONS.find(q => (q.q || '').toLowerCase().replace(/[^a-z0-9]/g, '') === normQ);
    if (matchedTcat && matchedTcat.explain) {
      return res.json({
        success: true,
        explanation: matchedTcat.explain,
      });
    }
    if (isTcat) {
      return res.json({
        success: true,
        explanation: `Option ${String.fromCharCode(65 + (correctOption || 0))} is the verified correct answer according to official TCAT academic standards.`,
      });
    }

    // MDCAT Explanations: Exclusively pull verified explanations from hardcoded bank, never invoke Gemini
    const isMdcat = (subject && String(subject).toLowerCase().includes('mdcat')) || (topic && String(topic).toLowerCase().includes('mdcat'));
    const matchedMdcat = ALL_MDCAT_QUESTIONS.find(q => (q.q || '').toLowerCase().replace(/[^a-z0-9]/g, '') === normQ);
    if (matchedMdcat && matchedMdcat.explain) {
      return res.json({
        success: true,
        explanation: matchedMdcat.explain,
      });
    }
    if (isMdcat) {
      return res.json({
        success: true,
        explanation: `Option ${String.fromCharCode(65 + (correctOption || 0))} is the verified correct answer according to official PMDC MDCAT academic standards.`,
      });
    }

    const userChoiceStr =
      selectedOption !== null && selectedOption !== undefined && options && options[selectedOption]
        ? options[selectedOption]
        : "Skipped";
    const correctChoiceStr = options && typeof correctOption === "number" && options[correctOption] ? options[correctOption] : "Correct Option";

    try {
      const ai = getGeminiClient();
      if (ai) {
        const explanationPrompt = `Provide a detailed academic explanation for the following multiple-choice question:
Subject: ${subject || "General"}
Topic: ${topic || "Core Concept"}
Question: ${question}
Options:
A) ${options?.[0] || "N/A"}
B) ${options?.[1] || "N/A"}
C) ${options?.[2] || "N/A"}
D) ${options?.[3] || "N/A"}

Correct Option: Option ${String.fromCharCode(65 + (correctOption || 0))} (${correctChoiceStr})
Student Selected: ${selectedOption !== null && selectedOption !== undefined ? `Option ${String.fromCharCode(65 + selectedOption)} (${userChoiceStr})` : "Skipped"}

Explain step-by-step in 3 clear bullet points:
1. Core Concept: Define the key law, principle, or formula.
2. Step-by-Step Solution: Show why Option ${String.fromCharCode(65 + (correctOption || 0))} is factually and logically correct.
3. Common Pitfall / Exam Tip: Explain why other options or common misconceptions are incorrect.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: explanationPrompt,
          config: {
            temperature: 0.1, // Low temperature for factual accuracy
          }
        });

        if (response.text) {
          return res.json({
            success: true,
            explanation: response.text.trim()
          });
        }
      }
    } catch (err: any) {
      console.warn("Gemini AI explanation error, using structured fallback:", err?.message || err);
    }

    return res.json({
      success: true,
      explanation: `1. Core Concept: This question evaluates key conceptual principles of ${subject || "this subject"} (${topic || "General Concepts"}).\n2. Solution: Option ${String.fromCharCode(65 + (correctOption || 0))} (${correctChoiceStr}) directly follows from standard textbook definitions and rules.\n3. Exam Tip: Double-check standard units and formulas when solving under time constraints.`
    });
  });

  // --- STUDY BUDDY RATE LIMITER & AI STREAMING ---
  const studyBuddyRateLimitMap = new Map<string, { count: number; resetTime: number }>();

  // Cleanup old rate limit records every 5 minutes to prevent memory leaks in long-running Node.js processes
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of studyBuddyRateLimitMap.entries()) {
      if (now > record.resetTime) {
        studyBuddyRateLimitMap.delete(ip);
      }
    }
  }, 5 * 60 * 1000);

  function checkStudyBuddyRateLimit(ip: string): { allowed: boolean; message?: string } {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1-minute rolling window
    const maxRequestsPerMinute = 15; // Max 15 messages/explanations per minute per client IP

    const record = studyBuddyRateLimitMap.get(ip);
    if (!record || now > record.resetTime) {
      studyBuddyRateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
      return { allowed: true };
    }

    if (record.count >= maxRequestsPerMinute) {
      return {
        allowed: false,
        message: "You've sent quite a few study questions recently! Please take a quick 1-minute breather before asking another question to protect study resources."
      };
    }

    record.count += 1;
    return { allowed: true };
  }

  const STUDY_BUDDY_SYSTEM_INSTRUCTION = `You are 'Study Buddy 🎓', an AI academic tutor and onboarding guide for Boardly (Board Exams, MDCAT, TCAT).

STRICT RESPONSE FORMAT & MARKDOWN HEADINGS MANDATE:
1. SHORT & DIRECT: Keep answers concise, direct, and well-structured. Absolutely NO long walls of text or conversational fluff.
2. NO FILLER OR REPETITION: Get straight to the answer immediately. Do NOT restate or repeat the user's question. Do NOT include generic intro or outro filler (e.g., NEVER write "Welcome to Boardly!", "Here's a breakdown!", "Hope this helps!").
3. MANDATORY MARKDOWN HEADINGS (## or ###): Whenever a question covers multiple topics (such as Free Trial vs. Paid Plan, or multiple distinct features/steps):
   - Every distinct topic MUST get its own Markdown heading starting with '## ' (e.g., '## Free Trial' and '## Paid Plan') on a new line.
   - You MUST put a blank line immediately after the heading before the body text.
   - Provide a short, direct block of 1-2 sentences for each topic.
   - Leave a blank line between sections so each topic is visually separate and distinct.
   - NEVER run topics together as a single block or continuous paragraph.
   - NEVER merge the heading word and sentence text together without linebreaks (e.g., NEVER write 'Free Trial FeaturesIncludes access to...').
   - NEVER use inline bold text with colons inside continuous text (e.g., NEVER write '**Free Trial:** Includes...').
4. MAXIMUM 2-4 DISTINCT SECTIONS: Limit multi-topic answers to 2-4 distinct sections.
5. ACADEMIC & ONBOARDING SCOPE ONLY: Only answer academic syllabus questions or Boardly platform onboarding queries. Refuse off-topic non-educational requests politely in 1 sentence.
6. MARKDOWN FORMAT: Respond in standard markdown with LaTeX math ($inline$ and $$block$$). NEVER output raw JSON wrappers.

OFFICIAL SUPPORT CONTACT & ANTI-HALLUCINATION POLICY (MANDATORY):
- REAL SUPPORT CONTACT: The ONLY real, monitored support contact email for Boardly / SHS Academy is shsvirtualadmin@gmail.com (the SHS Academy Administrator email).
- NEVER INVENT CONTACTS: NEVER invent, guess, assume, or make up contact emails, website URLs, phone numbers, or support channels that aren't explicitly provided here (such as "support@boardly.app", "contact@boardly.com", or other fabricated addresses). If you do not know a real contact for something, state directly that you don't know rather than fabricating one.
- SUSPENDED ACCOUNT INQUIRIES: If a student asks about account suspension (e.g., "I got suspended, what should I do now?", "Why is my account suspended?", "How do I reactivate my account?"), tell them to contact the SHS Academy Administrator at shsvirtualadmin@gmail.com for assistance or account reactivation, matching the official Account Suspended notice.

EXAMPLE REQUIRED OUTPUT STRUCTURE FOR MULTI-TOPIC QUESTIONS:

## Free Trial

Access sample past papers, test series preview, and Study Buddy AI.

## Paid Plan

Full access to all Board Exams, MDCAT, and TCAT solved past papers, complete test series, detailed analytics, and unlimited AI tutoring.

## Account Support

For account assistance, suspensions, or reactivation inquiries, contact the SHS Academy Administrator at shsvirtualadmin@gmail.com.`;

  // API Endpoint: Streaming AI Chatbot for Study Buddy
  app.post("/api/study-buddy/stream", async (req, res) => {
    const clientIp = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "client-default");
    const rateCheck = checkStudyBuddyRateLimit(clientIp);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    if (!rateCheck.allowed) {
      res.write(`data: ${JSON.stringify({ error: rateCheck.message, rateLimited: true })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      return res.end();
    }

    const { userId, userEmail, userProfile, messages = [], mcqContext, sessionContext, trackInfo } = req.body || {};

    // Automatically log incoming query to study buddy history
    try {
      const lastUserMsg = messages && messages.length > 0
        ? [...messages].reverse().find((m: any) => m.role === 'user' || m.sender === 'user')
        : null;
      const msgText = lastUserMsg ? (lastUserMsg.text || lastUserMsg.message_text || lastUserMsg.content) : null;
      if (msgText && typeof msgText === 'string' && msgText.trim()) {
        const studentIdentifier = String(userId || (userEmail ? userEmail.split('@')[0] : "student"));
        const logEntry: ServerStudyBuddyLogItem = {
          id: `sb-stream-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          student_id: studentIdentifier,
          student_name: userProfile?.name || (userEmail ? userEmail.split('@')[0] : "Student"),
          student_email: userEmail || "",
          role: "user",
          message_text: msgText.trim(),
          created_at: new Date().toISOString(),
          conversation_id: sessionContext?.conversationId || undefined,
        };
        inMemoryStudyBuddyLogs.unshift(logEntry);
        if (inMemoryStudyBuddyLogs.length > 500) inMemoryStudyBuddyLogs.pop();
        savePersistentStudyBuddyLogs();

        const db = getSupabaseAdminClient() || supabaseServer;
        if (db) {
          db.from("study_buddy_history").insert({
            student_id: studentIdentifier !== 'guest' ? studentIdentifier : null,
            role: 'user',
            message_text: logEntry.message_text,
            conversation_id: logEntry.conversation_id || null,
            created_at: logEntry.created_at,
          }).catch(() => {});
        }
      }
    } catch (logErr) {
      console.warn("[study-buddy stream log warning]:", logErr);
    }

    try {
      // Free Starter tier daily message check (5 msgs/day)
      const { user, isAdmin: verifiedAdmin } = await verifyAuthToken(req);
      const activeUserId = user ? user.id : String(userId || "guest");
      const activeEmail = user ? user.email : (userEmail || undefined);
      const isAdmin = verifiedAdmin || isAdminEmail(activeEmail);

      if (!isAdmin) {
        const isPro = await checkStudentIsPro(activeUserId, activeEmail);
        if (!isPro) {
          const todayDateStr = new Date().toISOString().slice(0, 10);
          const adminClient = getSupabaseAdminClient() || getAuthClient(req) || supabaseServer;
          if (adminClient) {
            let stQuery = adminClient.from('students').select('id, plan_tier, ai_messages_used_today, last_ai_message_date');
            if (activeUserId && activeUserId !== 'guest') {
              stQuery = stQuery.eq('id', activeUserId);
            } else if (activeEmail) {
              stQuery = stQuery.eq('email', activeEmail.trim().toLowerCase());
            }
            const { data: stRow } = await stQuery.maybeSingle();
            if (stRow) {
              const lastDate = stRow.last_ai_message_date || '';
              let currentAiCount = Number(stRow.ai_messages_used_today || 0);
              if (lastDate !== todayDateStr) {
                currentAiCount = 0;
              }

              if (currentAiCount >= 5) {
                res.write(`data: ${JSON.stringify({ error: "Daily limit reached — resets at midnight", limitExceeded: true, dailyLimitExceeded: true, ai_messages_used_today: currentAiCount })}\n\n`);
                res.write(`data: [DONE]\n\n`);
                return res.end();
              }

              // Atomically update AI messages used today
              const newCount = currentAiCount + 1;
              await adminClient.from('students').update({
                ai_messages_used_today: newCount,
                last_ai_message_date: todayDateStr,
                updated_at: new Date().toISOString()
              }).eq('id', stRow.id);
            }
          }
        }
      }

      const ai = getGeminiClient();
      if (!ai) {
        console.warn("[Study Buddy] Gemini API key missing or invalid.");
        res.write(`data: ${JSON.stringify({ error: "Gemini AI service is currently unavailable. Please verify API configuration." })}\n\n`);
        res.write(`data: [DONE]\n\n`);
        return res.end();
      }

      // Build track-aware and subject-aware dynamic system instruction
      const activeTrack = sessionContext?.track || trackInfo?.trackName || "Board Exams / MDCAT / TCAT";
      const activeSubject = sessionContext?.subject || mcqContext?.subject || "Academic Subjects";
      const activeTopic = sessionContext?.topic || mcqContext?.topic || "";
      const isOnboarding = Boolean(trackInfo?.isOnboarding || activeTrack.toLowerCase().includes('onboarding'));

      let dynamicSystemInstruction = "";
      if (isOnboarding) {
        dynamicSystemInstruction = `${STUDY_BUDDY_SYSTEM_INSTRUCTION}

ONBOARDING ASSISTANT ROLE:
You are helping a prospective student or visitor with Boardly onboarding, account creation, pricing, free trial vs paid plans, payment proof, supported courses, and account support.

STRICT CONCISE FORMAT RULES FOR ONBOARDING:
- Get straight to the answer immediately. No intros, no greetings, no question restatements.
- Use real Markdown headings starting with '## ' (e.g., '## Free Trial' and '## Paid Plan') on their own line for EACH distinct topic.
- Put a blank line immediately after the heading before the body text.
- Do NOT use inline bold labels with colons inside continuous paragraphs.
- Put 1-2 short, direct sentences of body text below each heading, separated by blank lines.

BOARDLY PLATFORM KNOWLEDGE:
1. Sign Up & Sign In: Google Sign-In or Email/Password. Google Sign-In is fast, passwordless, and secure.
2. Free Trial vs. Paid Plan:
   - Free Trial: Access to sample past papers, test series preview, and Study Buddy AI.
   - Paid Plan: Full access to all Board Exams (Classes 9-12), MDCAT & TCAT past paper solutions, full test series, analytics, and unlimited AI tutor.
3. Payment Proof & Activation: Pay via EasyPaisa, JazzCash, or Bank Transfer, then upload screenshot/receipt on Payment Verification page for fast activation.
4. Supported Courses: Board Exams (Classes 9, 10, 11, 12), PMDC MDCAT, UET Taxila TCAT.
5. Official Support Contact: The ONLY official support email is shsvirtualadmin@gmail.com (SHS Academy Administrator). For account suspensions, login issues, or activation help, tell the user to contact shsvirtualadmin@gmail.com. NEVER make up or guess any other email address.`;
      } else {
        dynamicSystemInstruction = `${STUDY_BUDDY_SYSTEM_INSTRUCTION}

ACTIVE STUDENT SESSION CONTEXT:
- Student Track/Exam: ${activeTrack}
- Current Subject Focus: ${activeSubject}${activeTopic ? ` (Topic: ${activeTopic})` : ''}

STRICT CONCISE FORMAT RULES:
- Directly answer the question for ${activeTrack} ${activeSubject}.
- Format every point or topic using a real Markdown heading starting with '## ' (e.g. ## Section Title) on its own separate line, followed by a blank line, and 1-2 short sentences of body text below it.
- Do NOT use inline bold colons or run-on paragraphs.
- No intro greetings or restating the question — begin immediately with the answer.

OFFICIAL SUPPORT & SUSPENSIONS:
- The ONLY real support contact is shsvirtualadmin@gmail.com.
- For account suspension, billing issues, or administrative assistance, instruct the student to contact shsvirtualadmin@gmail.com. Never invent or provide any fake email addresses.

CONTEXT RETENTION INSTRUCTION:
Tailor all answers, formulas, practice tips, and explanations to match the student's active track (${activeTrack}) and subject (${activeSubject}). Maintain this context naturally in all session responses without forcing the student to re-specify their board or exam type.`;
      }

      // Convert incoming message history to Gemini contents structure
      const rawContents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      if (Array.isArray(messages) && messages.length > 0) {
        for (const msg of messages) {
          if (msg && msg.text && typeof msg.text === "string" && msg.text.trim().length > 0) {
            const role = msg.role === "model" ? "model" : "user";
            rawContents.push({
              role,
              parts: [{ text: msg.text.trim() }],
            });
          }
        }
      }

      // Gemini requirement: contents MUST start with role 'user'
      while (rawContents.length > 0 && rawContents[0].role !== "user") {
        rawContents.shift();
      }

      // Merge consecutive messages with identical roles
      const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
      for (const item of rawContents) {
        if (contents.length > 0 && contents[contents.length - 1].role === item.role) {
          contents[contents.length - 1].parts[0].text += `\n${item.parts[0].text}`;
        } else {
          contents.push(item);
        }
      }

      // Fallback if no valid user message remains
      if (contents.length === 0) {
        contents.push({
          role: "user",
          parts: [{ text: "Hello Study Buddy! Please introduce yourself and explain how you can help me with my board exam studies." }],
        });
      }

      // If MCQ Context is present and this is a fresh explanation request, frame in prompt
      if (mcqContext && mcqContext.question) {
        const optionLetters = ["A", "B", "C", "D"];
        const correctChoiceStr = mcqContext.options?.[mcqContext.correctOption] || "Correct Option";
        const userChoiceStr =
          mcqContext.selectedOption !== null && mcqContext.selectedOption !== undefined && mcqContext.options?.[mcqContext.selectedOption]
            ? mcqContext.options[mcqContext.selectedOption]
            : "Skipped";

        const contextHeader = `[MCQ Explanation Context]
Subject: ${mcqContext.subject || "Board Subject"}
Topic: ${mcqContext.topic || "Core Concept"}
Question: ${mcqContext.question}
Options: ${mcqContext.options?.map((opt: string, i: number) => `${optionLetters[i]}) ${opt}`).join(", ")}
Correct Answer: Option ${optionLetters[mcqContext.correctOption || 0]} (${correctChoiceStr})
Student Selected: ${userChoiceStr}

Please explain step-by-step why Option ${optionLetters[mcqContext.correctOption || 0]} is correct, why other choices or common mistakes are wrong, and provide a helpful study tip!`;

        const lastMsgText = contents[contents.length - 1].parts[0].text;
        if (!lastMsgText.includes(mcqContext.question)) {
          contents[contents.length - 1].parts[0].text = `${contextHeader}\n\n${lastMsgText}`;
        }
      }

      const studentQuestion = messages && messages.length > 0 ? (messages[messages.length - 1]?.text || "") : "";
      console.log(`[server.ts Study Buddy Request] Incoming prompt from student: "${studentQuestion.slice(0, 100)}" (Total messages: ${messages.length})`);
      console.log(`[server.ts Study Buddy Gemini Payload] Outgoing contents:`, JSON.stringify(contents, null, 2));

      const apiKey = getGeminiApiKey();
      const keyPrefix = apiKey ? `${apiKey.substring(0, 10)}...` : "NONE";
      console.log(`[server.ts Study Buddy Request] Using GEMINI_API_KEY (first 10 chars): "${keyPrefix}" (length: ${apiKey ? apiKey.length : 0})`);

      let streamSuccess = false;
      let lastErrMessage = "";
      let lastErrStatus = 500;

      if (apiKey) {
        // Modern supported Gemini model aliases
        const modelsToTry = ["gemini-3.8-flash", "gemini-3.6-flash"];
        for (const modelName of modelsToTry) {
          if (streamSuccess) break;
          for (let attempt = 1; attempt <= 2; attempt++) {
            if (streamSuccess) break;
            try {
              const callStartTime = Date.now();
              console.log(`[server.ts Study Buddy] Calling Gemini model ${modelName} (attempt ${attempt}) with 5s timeout...`);
              await withGeminiNativeAuth(apiKey, async () => {
                const streamPromise = ai.models.generateContentStream({
                  model: modelName,
                  contents,
                  config: {
                    systemInstruction: dynamicSystemInstruction,
                    temperature: 0.2,
                    topP: 0.95,
                  },
                });

                const timeoutPromise = new Promise((_, reject) => {
                  setTimeout(() => reject(new Error(`Gemini API call timed out after 5000ms for ${modelName}`)), 5000);
                });

                const responseStream: any = await Promise.race([streamPromise, timeoutPromise]);

                for await (const chunk of responseStream) {
                  const chunkText = chunk.text;
                  if (chunkText) {
                    res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
                  }
                }

                res.write(`data: [DONE]\n\n`);
                streamSuccess = true;
                console.log(`[server.ts Study Buddy] Gemini stream completed successfully via ${modelName} in ${Date.now() - callStartTime}ms`);
              });
            } catch (modelErr: any) {
              lastErrStatus = Number(modelErr?.status || modelErr?.statusCode || modelErr?.code) || 500;
              lastErrMessage = extractCleanErrorMessage(modelErr);
              console.warn(`[server.ts Study Buddy] Model ${modelName} attempt ${attempt} failed (Status ${lastErrStatus}):`, lastErrMessage);

              // ONLY retry on 503 / 504 server overload. NEVER retry on 403, 401, 404, or 429 quota exhausted
              const isTransient = (lastErrStatus === 503 || lastErrStatus === 504) && !lastErrMessage.toLowerCase().includes("denied");
              if (isTransient && attempt < 2) {
                const backoffMs = 500;
                console.log(`[server.ts Study Buddy] Backing off for ${backoffMs}ms before retry...`);
                await new Promise((resolve) => setTimeout(resolve, backoffMs));
              } else {
                break; // Exit retry loop immediately!
              }
            }
          }
        }
      }

      // If Gemini live stream did not succeed, use the Academic Curriculum Knowledge Engine
      if (!streamSuccess) {
        console.log(`[server.ts Study Buddy] Gemini stream unavailable (Status ${lastErrStatus}). Invoking Curriculum Knowledge Engine...`);
        const explanation = generateAcademicExplanation(studentQuestion, mcqContext, sessionContext, trackInfo);

        if (explanation && explanation.trim()) {
          console.log(`[server.ts Study Buddy Curriculum Engine] Serving authentic academic explanation for "${studentQuestion.slice(0, 40)}" (${explanation.length} chars)`);
          const chunks = explanation.match(/.{1,60}(\s|$)/g) || [explanation];
          for (const chunk of chunks) {
            res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
            await new Promise((resolve) => setTimeout(resolve, 20));
          }
          res.write(`data: [DONE]\n\n`);
          streamSuccess = true;
        }
      }

      // If still not successful, return an honest, specific status error
      if (!streamSuccess) {
        let friendlyMessage = "Study Buddy is temporarily experiencing high demand. Please try again in a moment.";
        let canRetry = true;
        if (!apiKey) {
          friendlyMessage = "Study Buddy is currently undergoing maintenance. Please try again shortly.";
          canRetry = false;
        } else if (lastErrStatus === 403) {
          friendlyMessage = "Study Buddy AI is temporarily restricted by Google Cloud API permissions (Status 403 PERMISSION_DENIED). Please contact support (shsvirtualadmin@gmail.com) or retry shortly.";
          canRetry = false;
        } else if (lastErrStatus === 429) {
          friendlyMessage = "Study Buddy daily AI capacity limit reached. Please try again in a short while or contact shsvirtualadmin@gmail.com.";
          canRetry = true;
        }

        console.warn(`[server.ts Study Buddy Stream Error]: status=${lastErrStatus}, returning honest error message:`, friendlyMessage);
        res.write(`data: ${JSON.stringify({ error: friendlyMessage, canRetry, status: lastErrStatus })}\n\n`);
        res.write(`data: [DONE]\n\n`);
      }

      return res.end();
    } catch (err: any) {
      console.warn("[api/study-buddy/stream route error]:", err);
      const friendlyMessage = "Study Buddy is temporarily busy. Please try asking your question again in a moment.";
      res.write(`data: ${JSON.stringify({ error: friendlyMessage, canRetry: true })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      return res.end();
    }
  });

  // Local Past Papers Persistence Store
  const PAST_PAPERS_DIR = path.join(process.cwd(), "data");
  const UPLOADS_DIR = path.join(PAST_PAPERS_DIR, "uploads");
  const PAST_PAPERS_FILE = path.join(PAST_PAPERS_DIR, "past_papers.json");

  function ensurePastPapersDirs() {
    if (!fs.existsSync(PAST_PAPERS_DIR)) fs.mkdirSync(PAST_PAPERS_DIR, { recursive: true });
    if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  function loadLocalPastPapers(): any[] {
    try {
      ensurePastPapersDirs();
      if (fs.existsSync(PAST_PAPERS_FILE)) {
        const raw = fs.readFileSync(PAST_PAPERS_FILE, "utf-8");
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error("Error reading past_papers.json:", err);
    }
    return [];
  }

  function saveLocalPastPaper(paper: any) {
    try {
      ensurePastPapersDirs();
      const current = loadLocalPastPapers();
      const idx = current.findIndex((p: any) => p.id === paper.id);
      if (idx >= 0) {
        current[idx] = paper;
      } else {
        current.unshift(paper);
      }
      fs.writeFileSync(PAST_PAPERS_FILE, JSON.stringify(current, null, 2), "utf-8");
    } catch (err) {
      console.error("Error saving to past_papers.json:", err);
    }
  }

  function deleteLocalPastPaper(id: string) {
    try {
      ensurePastPapersDirs();
      const current = loadLocalPastPapers();
      const filtered = current.filter((p: any) => p.id !== id);
      fs.writeFileSync(PAST_PAPERS_FILE, JSON.stringify(filtered, null, 2), "utf-8");

      try {
        if (fs.existsSync(UPLOADS_DIR)) {
          const files = fs.readdirSync(UPLOADS_DIR);
          for (const f of files) {
            if (f.startsWith(id)) {
              fs.unlinkSync(path.join(UPLOADS_DIR, f));
            }
          }
        }
      } catch (fErr) {
        console.warn("Notice: file removal warning:", fErr);
      }
    } catch (err) {
      console.error("Error deleting past paper:", err);
    }
  }

  // Setup Multer for Express Drive Upload Endpoint
  const driveUploadMulter = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024 }, // 15MB Max
  });

  // API Endpoint: Serve local uploaded past paper files
  app.get("/api/drive-file/:filename", (req: express.Request, res: express.Response) => {
    try {
      const filename = path.basename(req.params.filename);
      const filePath = path.join(UPLOADS_DIR, filename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).send("File not found.");
      }
      const ext = filename.split(".").pop()?.toLowerCase();
      let contentType = "application/octet-stream";
      if (ext === "pdf") contentType = "application/pdf";
      else if (["jpg", "jpeg"].includes(ext || "")) contentType = "image/jpeg";
      else if (ext === "png") contentType = "image/png";
      else if (ext === "webp") contentType = "image/webp";

      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.sendFile(filePath);
    } catch (err) {
      return res.status(500).send("Error reading requested file.");
    }
  });

  // API Endpoint: Google Drive Upload (Strict Admin-Only Restriction)
  app.post("/api/drive-upload", driveUploadMulter.single("file") as any, async (req: any, res: any) => {
    try {
      // 1. Strict Server-Side Admin Role Verification
      const { user: tokenUser, isAdmin: isTokenAdmin } = await verifyAuthToken(req);
      const headerAdminEmail = (req.headers["x-admin-email"] as string || "").trim().toLowerCase();
      const bodyAdminEmail = (req.body?.adminEmail || "").trim().toLowerCase();
      const isAdmin = isTokenAdmin || isAdminEmail(headerAdminEmail) || isAdminEmail(bodyAdminEmail);

      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          error: "Forbidden: Uploading past papers and resources is strictly restricted to authorized administrators.",
        });
      }

      const file = (req as any).file;
      if (!file) {
        return res.status(400).json({ success: false, error: "No file uploaded. Please include a file in the 'file' field." });
      }

      if (file.size > 15 * 1024 * 1024) {
        return res.status(400).json({ success: false, error: "File size limit exceeded: Maximum allowed size is 15MB." });
      }

      const allowedMimePrefixes = ["image/"];
      const allowedMimes = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
      const ext = (file.originalname || "").split(".").pop()?.toLowerCase() || "pdf";
      const isAllowedExt = ["pdf", "jpg", "jpeg", "png", "webp", "gif"].includes(ext);
      const isAllowedMime = allowedMimes.includes(file.mimetype) || allowedMimePrefixes.some(p => file.mimetype?.startsWith(p));

      if (!isAllowedExt && !isAllowedMime) {
        return res.status(400).json({
          success: false,
          error: "Invalid file type. Only PDF documents and Image files (JPG, PNG, WEBP, GIF) are accepted.",
        });
      }

      // Check PDF file integrity if uploaded file is a PDF
      if (ext === "pdf" || file.mimetype === "application/pdf") {
        if (!file.buffer || file.buffer.length < 64) {
          return res.status(400).json({
            success: false,
            error: "Upload failed — file appears corrupted, please try again",
          });
        }

        const inspectLength = Math.min(1024, file.buffer.length);
        const headerText = file.buffer.toString("latin1", 0, inspectLength);
        if (!headerText.includes("%PDF-")) {
          return res.status(400).json({
            success: false,
            error: "Upload failed — file appears corrupted, please try again",
          });
        }
      }

      const category = (req.body?.category || "General").trim();
      const title = (req.body?.title || file.originalname).trim();

      // Attempt Google Drive Upload
      let uploadedDriveItem: any = null;
      try {
        const accessToken = await getGoogleAccessToken(process.env);
        const SHARED_FOLDER_ID = "1Kb6pb7EKoS5mCWPI8tRPeG1rc3yqpMsv";
        const metadata = {
          name: title || file.originalname,
          parents: [SHARED_FOLDER_ID],
        };

        const boundary = "-------" + Math.random().toString(36).substring(2);
        const delimiter = `\r\n--${boundary}\r\n`;
        const closeDelimiter = `\r\n--${boundary}--`;

        const fileBuffer = file.buffer;
        const fileUint8 = new Uint8Array(fileBuffer);
        const encoder = new TextEncoder();
        const part1 = encoder.encode(
          `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n${delimiter}Content-Type: ${file.mimetype || "application/octet-stream"}\r\n\r\n`
        );
        const part2 = encoder.encode(closeDelimiter);

        const multipartBody = new Uint8Array(part1.length + fileUint8.length + part2.length);
        multipartBody.set(part1, 0);
        multipartBody.set(fileUint8, part1.length);
        multipartBody.set(part2, part1.length + fileUint8.length);

        const driveRes = await fetch(
          "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,createdTime",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": `multipart/related; boundary=${boundary}`,
            },
            body: multipartBody,
          }
        );

        if (driveRes.ok) {
          uploadedDriveItem = await driveRes.json();
          console.log(`✅ [Google Drive Upload Succeeded]: File ID ${uploadedDriveItem.id}, Name: ${uploadedDriveItem.name}`);
        } else {
          const errText = await driveRes.text();
          console.warn(`Notice: Google Drive API returned ${driveRes.status}, switching to seamless persistent storage:`, errText);
        }
      } catch (driveErr: any) {
        console.warn("Notice: Google Drive API exception, using persistent local storage:", driveErr?.message || driveErr);
      }

      // If Drive upload succeeded, save record
      if (uploadedDriveItem && uploadedDriveItem.id) {
        const paperItem = {
          id: uploadedDriveItem.id,
          name: title || uploadedDriveItem.name,
          webViewLink: uploadedDriveItem.webViewLink,
          webContentLink: uploadedDriveItem.webContentLink,
          createdTime: uploadedDriveItem.createdTime || new Date().toISOString(),
          mimeType: file.mimetype,
          size: file.size,
          category,
          source: "google_drive",
        };
        saveLocalPastPaper(paperItem);
        return res.status(200).json({ success: true, ...paperItem });
      }

      // High-availability fallback: Save file to disk in ./data/uploads and generate serving link
      ensurePastPapersDirs();
      const fileId = `paper-${Date.now()}`;
      const filename = `${fileId}.${ext}`;
      const filePath = path.join(UPLOADS_DIR, filename);
      fs.writeFileSync(filePath, file.buffer);

      const fileUrl = `/api/drive-file/${filename}`;
      const paperItem = {
        id: fileId,
        name: title || file.originalname,
        webViewLink: fileUrl,
        webContentLink: fileUrl,
        createdTime: new Date().toISOString(),
        mimeType: file.mimetype,
        size: file.size,
        category,
        source: "local_storage",
      };

      saveLocalPastPaper(paperItem);
      console.log(`✅ [Past Paper Saved Persistently]: ID ${fileId}, Name: ${paperItem.name}, URL: ${fileUrl}`);

      return res.status(200).json({
        success: true,
        ...paperItem,
      });
    } catch (err: any) {
      console.error("[api/drive-upload error]:", err);
      return res.status(500).json({ success: false, error: err?.message || "Internal server error uploading file." });
    }
  });

  // API Endpoint: Google Drive List (Combines Drive files & Persisted Local Papers)
  app.get("/api/drive-list", async (req: express.Request, res: express.Response) => {
    try {
      const queryEmail = (req.query.studentEmail as string || "").trim().toLowerCase();
      const queryGrade = (req.query.grade as string || "").trim();
      const queryStream = (req.query.stream as string || "").trim();

      const { user: tokenUser, isAdmin: isTokenAdmin } = await verifyAuthToken(req);
      const resolvedEmail = (tokenUser?.email || queryEmail).trim().toLowerCase();
      const isAdmin = isTokenAdmin || (resolvedEmail ? isAdminEmail(resolvedEmail) : false);

      const db = getSupabaseAdminClient() || supabaseServer;

      // Determine student allowed classes
      let allowedClasses: string[] | null = null;
      if (!isAdmin) {
        let studentRecord: any = null;
        if (db && (resolvedEmail || tokenUser?.id)) {
          try {
            let sQuery = db.from("students").select("id, email, grade, stream, assigned_classes, package_name, subscribed_plans, is_pro, payment_status");
            if (tokenUser?.id) {
              sQuery = sQuery.or(`id.eq.${tokenUser.id},email.eq.${resolvedEmail}`);
            } else if (resolvedEmail) {
              sQuery = sQuery.eq("email", resolvedEmail);
            }
            const { data: sData } = await sQuery.maybeSingle();
            studentRecord = sData;
          } catch (stErr) {
            console.warn("[api/drive-list student lookup warning]:", stErr);
          }
        }

        if (!studentRecord && (queryGrade || queryStream)) {
          studentRecord = { grade: queryGrade, stream: queryStream };
        }

        if (studentRecord) {
          allowedClasses = parseAssignedClassesServer(studentRecord);
        }
      }

      const localPapers = loadLocalPastPapers();
      let driveFiles: any[] = [];

      try {
        const accessToken = await getGoogleAccessToken(process.env);
        const SHARED_FOLDER_ID = "1Kb6pb7EKoS5mCWPI8tRPeG1rc3yqpMsv";
        const query = `'${SHARED_FOLDER_ID}' in parents and trashed = false`;
        const fields = "files(id,name,webViewLink,webContentLink,createdTime,mimeType,size)";
        const driveUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&orderBy=createdTime%20desc`;

        const driveRes = await fetch(driveUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (driveRes.ok) {
          const data = await driveRes.json();
          driveFiles = (data.files || []).map((f: any) => ({
            id: f.id,
            name: f.name,
            webViewLink: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
            webContentLink: f.webContentLink || `https://drive.google.com/uc?id=${f.id}&export=download`,
            createdTime: f.createdTime,
            mimeType: f.mimeType,
            size: f.size,
            category: "General",
            source: "google_drive",
          }));
        }
      } catch (dErr: any) {
        console.warn("Notice: Drive API fetch warning in drive-list:", dErr?.message);
      }

      // Merge and deduplicate
      const combinedMap = new Map<string, any>();
      for (const p of localPapers) combinedMap.set(p.id, p);
      for (const f of driveFiles) {
        if (!combinedMap.has(f.id)) combinedMap.set(f.id, f);
      }

      let allFiles = Array.from(combinedMap.values()).sort((a, b) => {
        const tA = new Date(a.createdTime || 0).getTime();
        const tB = new Date(b.createdTime || 0).getTime();
        return tB - tA;
      });

      // Filter files for student by assigned class/track
      if (!isAdmin && allowedClasses && allowedClasses.length > 0) {
        allFiles = allFiles.filter((f) => {
          const fCat = (f.category || "").toLowerCase();
          const fName = (f.name || "").toLowerCase();
          const isGeneral = fCat === "general" || fCat === "all" || (!fCat && !fName.includes("class") && !fName.includes("mdcat") && !fName.includes("tcat"));
          if (isGeneral) return true;

          return allowedClasses!.some((ac) => {
            const normAc = ac.toLowerCase().replace(/\s+/g, "");
            const normCat = fCat.replace(/\s+/g, "");
            const normName = fName.replace(/\s+/g, "");
            return normCat.includes(normAc) || normName.includes(normAc);
          });
        });
      }

      return res.status(200).json(allFiles);
    } catch (err: any) {
      console.error("[api/drive-list error]:", err);
      return res.status(500).json({ success: false, error: err?.message || "Internal server error listing Drive files." });
    }
  });

  // API Endpoint: Delete Past Paper Document (Admin Only)
  app.delete("/api/drive-delete/:id", async (req: express.Request, res: express.Response) => {
    try {
      const { user: tokenUser, isAdmin: isTokenAdmin } = await verifyAuthToken(req);
      const headerAdminEmail = (req.headers["x-admin-email"] as string || "").trim().toLowerCase();
      const bodyAdminEmail = (req.query?.adminEmail as string || "").trim().toLowerCase();
      const isAdmin = isTokenAdmin || isAdminEmail(headerAdminEmail) || isAdminEmail(bodyAdminEmail);

      if (!isAdmin) {
        return res.status(403).json({ success: false, error: "Forbidden: Deleting study resources is strictly restricted to administrators." });
      }

      const { id } = req.params;
      deleteLocalPastPaper(id);
      return res.status(200).json({ success: true, message: "Past paper removed successfully." });
    } catch (err: any) {
      console.error("[api/drive-delete error]:", err);
      return res.status(500).json({ success: false, error: err?.message || "Failed to delete file." });
    }
  });

  // Gmail SMTP / API Email Setup & Helper Functions
  function getGmailAuthConfig() {
    const emailUser = getEnvVar("EMAIL_USER");
    const emailPass = getEnvVar("EMAIL_APP_PASSWORD");
    const clientId = getEnvVar("GMAIL_CLIENT_ID", getEnvVar("GOOGLE_CLIENT_ID", ""));
    const clientSecret = getEnvVar("GMAIL_CLIENT_SECRET", getEnvVar("GOOGLE_CLIENT_SECRET", ""));
    const refreshToken = getEnvVar("GMAIL_REFRESH_TOKEN", getEnvVar("GOOGLE_REFRESH_TOKEN", ""));
    const accessToken = getEnvVar("GMAIL_ACCESS_TOKEN", getEnvVar("GOOGLE_ACCESS_TOKEN", ""));
    const fromName = getEnvVar("EMAIL_FROM_NAME", "Boardly Support");

    const isPassAuth = Boolean(emailUser && emailPass);
    const isOAuth = Boolean(emailUser && clientId && refreshToken);

    return {
      emailUser,
      emailPass,
      clientId,
      clientSecret,
      refreshToken,
      accessToken,
      fromName,
      isPassAuth,
      isOAuth,
      isConfigured: isPassAuth || isOAuth,
    };
  }

  let mailTransporter: nodemailer.Transporter | null = null;
  function getMailTransporter(): nodemailer.Transporter | null {
    const config = getGmailAuthConfig();

    console.log("====================================");
    console.log("[GMAIL SMTP / API CONFIGURATION DIAGNOSTICS]");
    console.log(`- EMAIL_USER: ${config.emailUser ? `Set ("${config.emailUser}")` : "MISSING ❌"}`);
    console.log(`- EMAIL_APP_PASSWORD: ${config.emailPass ? `Set (${config.emailPass.length} chars, masked: "${config.emailPass.slice(0, 3)}...${config.emailPass.slice(-3)}")` : "MISSING ❌"}`);
    console.log(`- GMAIL_CLIENT_ID: ${config.clientId ? "Set" : "Not Set"}`);
    console.log(`- GMAIL_CLIENT_SECRET: ${config.clientSecret ? "Set" : "Not Set"}`);
    console.log(`- GMAIL_REFRESH_TOKEN: ${config.refreshToken ? "Set" : "Not Set"}`);
    console.log(`- GMAIL_ACCESS_TOKEN: ${config.accessToken ? "Set" : "Not Set"}`);
    console.log(`- EMAIL_FROM_NAME: "${config.fromName}"`);
    console.log(`- Authentication Type Selected: ${config.isOAuth ? "OAuth2" : config.isPassAuth ? "Gmail App Password (SMTP)" : "NONE (No valid credentials provided)"}`);
    console.log("====================================");

    if (!config.isConfigured) {
      console.warn("[getMailTransporter Warning]: Neither App Password nor OAuth2 credentials are completely configured.");
      return null;
    }

    if (!mailTransporter) {
      if (config.isOAuth) {
        console.log("[getMailTransporter] Initializing Nodemailer with Gmail OAuth2 transport...");
        mailTransporter = nodemailer.createTransport({
          service: "gmail",
          pool: true,
          maxConnections: 5,
          maxMessages: 100,
          connectionTimeout: 10000,
          greetingTimeout: 5000,
          socketTimeout: 15000,
          auth: {
            type: "OAuth2",
            user: config.emailUser,
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            refreshToken: config.refreshToken,
            accessToken: config.accessToken || undefined,
          },
        });
      } else {
        console.log("[getMailTransporter] Initializing Nodemailer with Gmail App Password transport...");
        mailTransporter = nodemailer.createTransport({
          service: "gmail",
          pool: true,
          maxConnections: 5,
          maxMessages: 100,
          connectionTimeout: 10000,
          greetingTimeout: 5000,
          socketTimeout: 15000,
          auth: {
            user: config.emailUser,
            pass: config.emailPass,
          },
        });
      }
    }

    return mailTransporter;
  }



  async function sendEmail({
    to,
    subject,
    html,
  }: {
    to: string;
    subject: string;
    html: string;
  }): Promise<{ success: boolean; id?: string; durationMs?: number; error?: string; details?: any }> {
    console.log("====================================");
    console.log("[SEND EMAIL INVOKED]");
    console.log(`Recipient (To): ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);

    const config = getGmailAuthConfig();
    const transporter = getMailTransporter();

    if (!transporter || !config.emailUser) {
      const errorMsg = `Gmail SMTP credentials are missing or unconfigured. EMAIL_USER: ${config.emailUser ? "Set" : "Missing"}, EMAIL_APP_PASSWORD: ${config.emailPass ? "Set" : "Missing"}`;
      console.error(`[sendEmail ERROR] ${errorMsg}`);
      console.log("====================================");
      return { success: false, error: errorMsg };
    }

    // Confirm "From" address matches authenticated Gmail user
    const fromName = config.fromName || "Boardly Support";
    const fromAddress = `"${fromName}" <${config.emailUser}>`;

    console.log(`From Address Header: ${fromAddress}`);
    console.log(`Authenticated Gmail Account: ${config.emailUser}`);

    if (!fromAddress.includes(config.emailUser)) {
      console.warn(`[Gmail From Address Warning] The From address ("${fromAddress}") does not contain the authenticated user ("${config.emailUser}"). Gmail SMTP strictly requires the From address to match the authenticated Gmail account or an authorized alias.`);
    } else {
      console.log(`✅ [From Address Verification] Passed — From address matches authenticated user (${config.emailUser}).`);
    }

    const startTime = Date.now();
    console.log(`⏱️ [SMTP Timings Start] Dispatching email via Nodemailer to ${to} at ${new Date(startTime).toISOString()}`);

    try {
      const info = await transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        html,
      });

      const endTime = Date.now();
      const durationMs = endTime - startTime;

      console.log("✅ [Gmail SMTP Email Sent Successfully]");
      console.log(`⏱️ [SMTP Timings End] Completed email dispatch to ${to} in ${durationMs}ms (${(durationMs / 1000).toFixed(2)}s)`);
      console.log(`Message ID: ${info.messageId}`);
      console.log(`Accepted: ${JSON.stringify(info.accepted)}`);
      console.log(`Rejected: ${JSON.stringify(info.rejected)}`);
      console.log(`Response: ${info.response}`);
      console.log("====================================");

      return { success: true, id: info.messageId, durationMs, details: info };
    } catch (err: any) {
      const endTime = Date.now();
      const durationMs = endTime - startTime;

      console.error("====================================");
      console.error(`❌ [sendEmail EXCEPTION after ${durationMs}ms (${(durationMs / 1000).toFixed(2)}s)]`);
      console.error(`Error Message: ${err?.message}`);
      console.error(`Error Code: ${err?.code || "N/A"}`);
      console.error(`Error Command: ${err?.command || "N/A"}`);
      console.error(`Error Response Code: ${err?.responseCode || "N/A"}`);
      console.error(`Error Response: ${err?.response || "N/A"}`);
      if (err?.stack) {
        console.error(`Stack Trace:\n${err.stack}`);
      }

      // Specific error diagnostics for Google OAuth & App Password failure modes
      let userFriendlyError = err?.message || "Email dispatch failed.";

      if (err?.message?.includes("invalid_grant") || err?.message?.includes("Invalid Credentials") || err?.code === "EAUTH") {
        userFriendlyError = `Authentication failed for ${config.emailUser}. If using OAuth2, the refresh token may have expired or been revoked. If using an App Password, ensure 2FA is enabled and a fresh 16-character Gmail App Password is set.`;
        console.error(`🔍 [DIAGNOSTIC HINT]: ${userFriendlyError}`);
      } else if (err?.responseCode === 535 || err?.message?.includes("535 5.7.8")) {
        userFriendlyError = `Gmail SMTP Auth Failed (535 5.7.8). Please check your EMAIL_USER (${config.emailUser}) and EMAIL_APP_PASSWORD.`;
        console.error(`🔍 [DIAGNOSTIC HINT]: ${userFriendlyError}`);
      } else if (err?.responseCode === 550 || err?.message?.includes("quota") || err?.message?.includes("Rate limit")) {
        userFriendlyError = `Gmail sending quota exceeded or recipient address rejected (${config.emailUser}).`;
        console.error(`🔍 [DIAGNOSTIC HINT]: ${userFriendlyError}`);
      } else if (err?.code === "ESOCKET" || err?.code === "ETIMEDOUT" || err?.code === "ECONNREFUSED") {
        userFriendlyError = `Network / Connection timeout reaching Gmail SMTP server (smtp.gmail.com). Error code: ${err.code}`;
        console.error(`🔍 [DIAGNOSTIC HINT]: ${userFriendlyError}`);
      }

      console.error("====================================");

      return {
        success: false,
        durationMs,
        error: userFriendlyError,
        details: {
          code: err?.code,
          responseCode: err?.responseCode,
          response: err?.response,
          command: err?.command,
          rawMessage: err?.message,
        },
      };
    }
  }

  // Non-blocking, asynchronous fire-and-forget background email sender
  function sendEmailAsync({
    to,
    subject,
    html,
  }: {
    to: string;
    subject: string;
    html: string;
  }) {
    setImmediate(async () => {
      try {
        console.log(`[sendEmailAsync Background Triggered] Dispatching email to ${to}...`);
        await sendEmail({ to, subject, html });
      } catch (err: any) {
        console.error("[sendEmailAsync Background Error]:", err?.message || err);
      }
    });
  }



  // HTML Email Templates
  function generateSubmissionConfirmationEmail({
    name,
    email,
    method,
    amount,
    date,
    track,
    transactionRef,
  }: {
    name: string;
    email?: string;
    method: string;
    amount: string | number;
    date: string;
    track?: string;
    transactionRef?: string;
  }) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f7; margin: 0; padding: 24px 12px; color: #1a1a1a; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          .header { background: #10b981; color: #ffffff; padding: 24px 20px; text-align: center; }
          .header-brand { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; margin: 0 0 6px 0; }
          .header-subtitle { font-size: 15px; font-weight: 600; margin: 0; opacity: 0.95; }
          .body { padding: 28px 24px; }
          .greeting { font-size: 18px; font-weight: 800; color: #1a1a1a; margin: 0 0 12px 0; }
          .paragraph { font-size: 14px; line-height: 1.6; color: #333333; margin: 0 0 16px 0; }
          .divider { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
          .info-box { background: #f8fafc; border-radius: 10px; padding: 18px; border: 1px solid #e2e8f0; margin: 16px 0; }
          .info-title { font-size: 12px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin-bottom: 12px; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; }
          .info-label { color: #666666; font-weight: 500; }
          .info-value { font-weight: 700; color: #1a1a1a; }
          .btn-container { text-align: center; margin-top: 20px; }
          .btn-whatsapp { display: inline-block; background-color: #25D366; color: #ffffff !important; text-decoration: none; padding: 12px 22px; border-radius: 8px; font-weight: 700; font-size: 13px; }
          .footer { text-align: center; font-size: 12px; color: #888888; padding: 20px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-brand">Boardly — Official Portal</div>
            <div class="header-subtitle">Thanks, ${name}! Your payment is being reviewed.</div>
          </div>
          <div class="body">
            <div class="greeting">We've received your payment proof</div>
            <p class="paragraph">
              We have successfully received your payment proof submission. Our verification team is currently reviewing your details to upgrade your account to Premium access.
            </p>
            <p class="paragraph">
              Reviews typically take <strong>2–4 hours</strong>. You will receive an email notification as soon as your payment is approved!
            </p>
            <hr class="divider" />
            <div class="info-box">
              <div class="info-title">Payment Summary</div>
              <div class="info-row"><span class="info-label">Track / Plan:</span> <span class="info-value">${track || 'Boardly Premium'}</span></div>
              <div class="info-row"><span class="info-label">Amount Paid:</span> <span class="info-value">PKR ${amount}</span></div>
              <div class="info-row"><span class="info-label">Payment Account:</span> <span class="info-value">${method}</span></div>
              <div class="info-row"><span class="info-label">Transaction ID:</span> <span class="info-value">${transactionRef || 'N/A'}</span></div>
              <div class="info-row"><span class="info-label">Submitted At:</span> <span class="info-value">${date}</span></div>
            </div>
            <hr class="divider" />
            <div class="btn-container">
              <a href="https://wa.me/923222314436" class="btn-whatsapp" target="_blank">Questions? Message us on WhatsApp →</a>
            </div>
          </div>
          <div class="footer">
            Boardly — Official Portal | WhatsApp Support: +923222314436
          </div>
        </div>
      </body>
      </html>
    `;
  }

  function generatePaymentApprovedEmail({ name, method, amount }: { name: string; method: string; amount: string | number }) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: #ffffff; padding: 32px 24px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 800; }
          .body { padding: 28px 24px; }
          .badge-success { background: #d1fae5; color: #065f46; padding: 6px 14px; border-radius: 9999px; font-weight: 800; font-size: 13px; display: inline-block; margin-bottom: 16px; }
          .features { background: #f8fafc; border-radius: 12px; padding: 18px; margin: 20px 0; border: 1px solid #e2e8f0; }
          .features ul { margin: 8px 0 0; padding-left: 20px; color: #334155; font-size: 13px; line-height: 1.7; }
          .btn { display: block; width: 100%; text-align: center; background: #059669; color: #ffffff; text-decoration: none; padding: 12px 0; border-radius: 10px; font-weight: 700; font-size: 14px; margin-top: 24px; }
          .footer { text-align: center; font-size: 12px; color: #94a3b8; padding: 16px 24px; background: #f8fafc; border-top: 1px solid #f1f5f9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Boardly Premium Access</h1>
            <p style="margin: 4px 0 0; opacity: 0.9; font-size: 14px;">Your Access is Confirmed!</p>
          </div>
          <div class="body">
            <span class="badge-success">✓ Payment Verified & Approved</span>
            <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0;">Welcome to Boardly Premium, ${name}!</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #334155;">
              Your payment of <strong>PKR ${amount}</strong> via <strong>${method}</strong> has been verified by our team. Your account is now upgraded to <strong>Boardly Premium Access</strong>!
            </p>
            <div class="features">
              <strong style="font-size: 13px; color: #0f172a;">What's Unlocked for You:</strong>
              <ul>
                <li>Unlimited MDCAT &amp; Federal Board Practice Tests</li>
                <li>AI Study Buddy Instant Step-by-Step Explanations</li>
                <li>Chapter-wise Analytics &amp; Weakness Tracking</li>
                <li>Full Past Papers &amp; Printable Test Generation</li>
              </ul>
            </div>
            <p style="font-size: 13px; color: #475569;">
              Log in to your Boardly dashboard right away to start practicing!
            </p>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} Boardly. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;
  }

  function generatePaymentRejectedEmail({ name, method, amount, adminNote }: { name: string; method: string; amount: string | number; adminNote?: string }) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          .header { background: linear-gradient(135deg, #e11d48 0%, #f43f5e 100%); color: #ffffff; padding: 28px 24px; text-align: center; }
          .header h1 { margin: 0; font-size: 20px; font-weight: 800; }
          .body { padding: 28px 24px; }
          .reason-box { background: #fff1f2; border-left: 4px solid #e11d48; padding: 14px; border-radius: 6px; margin: 18px 0; font-size: 13px; color: #881337; }
          .footer { text-align: center; font-size: 12px; color: #94a3b8; padding: 16px 24px; background: #f8fafc; border-top: 1px solid #f1f5f9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Boardly Support</h1>
            <p style="margin: 4px 0 0; opacity: 0.9; font-size: 13px;">Payment Verification Update</p>
          </div>
          <div class="body">
            <h2 style="font-size: 17px; font-weight: 700; color: #0f172a; margin-top: 0;">Hello ${name},</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #334155;">
              We reviewed your recent payment submission of <strong>PKR ${amount}</strong> via <strong>${method}</strong>, but unfortunately, we could not verify the details provided.
            </p>
            <div class="reason-box">
              <strong>Reason from Reviewer:</strong><br>
              ${adminNote || 'Transaction reference or payment screenshot could not be confirmed.'}
            </div>
            <p style="font-size: 13px; line-height: 1.5; color: #475569;">
              Don't worry! You can easily re-submit a clear screenshot of your payment receipt or double-check your transaction ID in your Boardly student profile.
            </p>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} Boardly. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;
  }

  function generateAdminPaymentNotificationEmail({
    name,
    email,
    method,
    amount,
    date,
    transactionRef,
    track,
    adminUrl,
  }: {
    name: string;
    email: string;
    method: string;
    amount: string | number;
    date: string;
    transactionRef?: string;
    track?: string;
    adminUrl?: string;
  }) {
    const defaultAdminUrl = adminUrl || "https://ais-pre-sunimgeeaslxzathtqw22b-183477009687.asia-east1.run.app/#admin-payment-requests";
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f7; margin: 0; padding: 24px 12px; color: #1a1a1a; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          .header { background: #10b981; color: #ffffff; padding: 24px 20px; text-align: center; }
          .header-brand { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; margin: 0 0 6px 0; }
          .header-subtitle { font-size: 16px; font-weight: 700; margin: 0; opacity: 0.95; }
          .body { padding: 28px 24px; }
          .info-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
          .info-table td { padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
          .info-table td.label { color: #666666; font-weight: 500; width: 40%; }
          .info-table td.value { font-weight: 700; color: #1a1a1a; width: 60%; }
          .divider { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
          .btn-container { text-align: center; margin-top: 20px; }
          .btn-admin { display: inline-block; background-color: #10b981; color: #ffffff !important; text-decoration: none; padding: 12px 22px; border-radius: 8px; font-weight: 700; font-size: 14px; text-align: center; }
          .footer { text-align: center; font-size: 12px; color: #888888; padding: 20px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-brand">Boardly — Official Portal</div>
            <div class="header-subtitle">New Payment Verification Request</div>
          </div>
          <div class="body">
            <p style="font-size: 14px; line-height: 1.5; color: #333333; margin-top: 0;">
              A new payment proof submission has been logged and requires review:
            </p>
            <table class="info-table">
              <tr><td class="label">Student Name:</td><td class="value">${name}</td></tr>
              <tr><td class="label">Email:</td><td class="value">${email}</td></tr>
              <tr><td class="label">Track / Plan:</td><td class="value">${track || 'Boardly Premium'}</td></tr>
              <tr><td class="label">Amount:</td><td class="value">PKR ${amount}</td></tr>
              <tr><td class="label">Payment Account:</td><td class="value">${method}</td></tr>
              <tr><td class="label">Transaction ID:</td><td class="value">${transactionRef || 'N/A'}</td></tr>
              <tr><td class="label">Submitted At:</td><td class="value">${date}</td></tr>
            </table>
            <hr class="divider" />
            <div class="btn-container">
              <a href="${defaultAdminUrl}" class="btn-admin" target="_blank">Review in Admin Panel →</a>
            </div>
          </div>
          <div class="footer">
            Boardly — Official Portal | WhatsApp Support: +923222314436
          </div>
        </div>
      </body>
      </html>
    `;
  }

  function generateWelcomeEmail({
    name,
    email,
    selectedTrack,
    dreamUniversity,
  }: {
    name: string;
    email: string;
    selectedTrack?: string;
    dreamUniversity?: string;
  }) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 24px; color: #1e293b; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #0f172a 0%, #1c1c1e 100%); color: #ffffff; padding: 32px 24px; text-align: center; border-bottom: 3px solid #f2b90c; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 900; color: #f2b90c; letter-spacing: -0.5px; }
          .header p { margin: 6px 0 0; color: #94a3b8; font-size: 13px; font-weight: 600; }
          .body { padding: 28px 28px; }
          .highlight-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; margin: 20px 0; }
          .badge-row { margin-bottom: 8px; font-size: 13px; color: #334155; }
          .label { font-weight: 700; color: #64748b; }
          .val { font-weight: 800; color: #0f172a; }
          .notice-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px 16px; border-radius: 8px; margin: 20px 0; font-size: 13px; color: #92400e; line-height: 1.5; }
          .option-card { background: #ffffff; border: 2px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 12px; text-align: left; }
          .btn-primary { display: inline-block; background: #f2b90c; color: #0f172a !important; text-decoration: none; padding: 12px 22px; border-radius: 9999px; font-weight: 900; font-size: 13px; margin-top: 8px; text-align: center; }
          .btn-community { display: inline-block; background: #25d366; color: #ffffff !important; text-decoration: none; padding: 12px 22px; border-radius: 9999px; font-weight: 900; font-size: 13px; margin-top: 8px; text-align: center; }
          .footer { text-align: center; font-size: 12px; color: #94a3b8; padding: 20px 24px; background: #f8fafc; border-top: 1px solid #f1f5f9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Boardly / SHS Virtual Academy Student Portal</h1>
            <p>Registration Confirmation & Student Welcome</p>
          </div>
          <div class="body">
            <h2 style="font-size: 19px; font-weight: 800; color: #0f172a; margin-top: 0;">Welcome, ${name}!</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #334155;">
              Thank you for starting your registration with us (${email}). We are excited to support your path toward academic excellence!
            </p>

            <div class="highlight-card">
              ${selectedTrack ? `<div class="badge-row"><span class="label">Selected Track:</span> <span class="val">${selectedTrack}</span></div>` : ''}
              ${dreamUniversity ? `<div class="badge-row"><span class="label">Dream Institution:</span> <span class="val">${dreamUniversity}</span></div>` : ''}
            </div>

            <div class="notice-box">
              <strong>⏳ Verification Notice:</strong><br>
              Account verification and payment processing may take a short time as our team reviews submitted details. However, you can jump into learning immediately!
            </div>

            <h3 style="font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 24px; margin-bottom: 12px;">In the Meantime, Choose How to Proceed:</h3>

            <div class="option-card">
              <strong style="font-size: 14px; color: #0f172a;">1. Start Free Tier Practice Immediately</strong>
              <p style="font-size: 12px; color: #64748b; margin: 4px 0 10px 0;">Access free practice MCQs, sample tests, and daily exam questions right away without waiting.</p>
              <a href="https://ais-pre-sunimgeeaslxzathtqw22b-183477009687.asia-east1.run.app" class="btn-primary" target="_blank">Launch Free Practice Tests</a>
            </div>

            <div class="option-card">
              <strong style="font-size: 14px; color: #0f172a;">2. Join Our Official Student Community</strong>
              <p style="font-size: 12px; color: #64748b; margin: 4px 0 10px 0;">Connect with peers, get past paper updates, and receive instant support from mentors in our WhatsApp community.</p>
              <a href="https://chat.whatsapp.com/DKA260XqH9f85G2f6n3Y6L" class="btn-community" target="_blank">Join WhatsApp Community</a>
            </div>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} Boardly / SHS Virtual Academy Platform. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // API Endpoint: Email Diagnostics to verify environment variables in production
  app.get("/api/email-diagnostics", async (req: express.Request, res: express.Response) => {
    try {
      const config = getGmailAuthConfig();
      
      const maskEmail = (email: string) => {
        if (!email || !email.includes("@")) return "MISSING ❌";
        const [local, domain] = email.split("@");
        const maskedLocal = local.length <= 3 ? local[0] + "***" : local.slice(0, 3) + "***";
        return `${maskedLocal}@${domain}`;
      };

      const maskPass = (pass: string) => {
        if (!pass) return "MISSING ❌";
        return `Set (${pass.length} chars, masked: "${pass.slice(0, 2)}...${pass.slice(-2)}")`;
      };

      return res.status(200).json({
        success: true,
        timestamp: new Date().toISOString(),
        emailConfig: {
          isConfigured: config.isConfigured,
          authTypeSelected: config.isOAuth ? "OAuth2" : config.isPassAuth ? "Gmail App Password (SMTP)" : "NONE (No valid credentials provided) ❌",
          EMAIL_USER: maskEmail(config.emailUser),
          EMAIL_APP_PASSWORD: maskPass(config.emailPass),
          GMAIL_CLIENT_ID: config.clientId ? "Set ✅" : "MISSING ❌",
          GMAIL_CLIENT_SECRET: config.clientSecret ? "Set ✅" : "MISSING ❌",
          GMAIL_REFRESH_TOKEN: config.refreshToken ? "Set ✅" : "MISSING ❌",
          EMAIL_FROM_NAME: config.fromName,
          targetAdminEmail: "shsvirtualadmin@gmail.com",
        }
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || "Error running email diagnostics" });
    }
  });

  // Rate-limiting and tracking stores for welcome email prevention of flooding attacks
  const welcomeEmailIpMap = new Map<string, { count: number; resetTime: number }>();
  const welcomeEmailTargetMap = new Map<string, number>();

  // API Endpoint: Send Welcome Email
  app.post("/api/send-welcome-email", async (req: express.Request, res: express.Response) => {
    try {
      const clientIp = ((req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "unknown").split(",")[0].trim();
      const now = Date.now();

      // 1. IP rate limiting: max 5 emails per 10 minutes per IP
      const ipRecord = welcomeEmailIpMap.get(clientIp);
      if (ipRecord) {
        if (now > ipRecord.resetTime) {
          welcomeEmailIpMap.set(clientIp, { count: 1, resetTime: now + 10 * 60 * 1000 });
        } else if (ipRecord.count >= 5) {
          return res.status(429).json({ success: false, error: "Too many email requests from this address. Please try again later." });
        } else {
          ipRecord.count += 1;
        }
      } else {
        welcomeEmailIpMap.set(clientIp, { count: 1, resetTime: now + 10 * 60 * 1000 });
      }

      const { name, email, selectedTrack, dreamUniversity } = req.body || {};
      const targetEmail = String(email || "").trim().toLowerCase();

      // 2. Strict email format & header injection prevention
      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;
      if (!targetEmail || targetEmail.length > 100 || !emailRegex.test(targetEmail) || /[\r\n]/.test(targetEmail)) {
        return res.status(400).json({ success: false, error: "Valid student email address is required." });
      }

      // 3. Target email rate limiting: max 1 email per target address every 15 minutes
      const lastSentTime = welcomeEmailTargetMap.get(targetEmail);
      if (lastSentTime && now - lastSentTime < 15 * 60 * 1000) {
        return res.status(429).json({ success: false, error: "A welcome email was already sent to this address recently. Please check your inbox or spam folder." });
      }

      // 4. Authorization check: must be verified user, admin, or registered student
      const { user, isAdmin } = await verifyAuthToken(req);
      let isAuthorized = false;

      if (user) {
        const userEmail = (user.email || "").trim().toLowerCase();
        if (isAdmin || userEmail === targetEmail) {
          isAuthorized = true;
        }
      }

      if (!isAuthorized) {
        const db = supabaseServer;
        if (db) {
          const { data: studentRecord } = await db
            .from("students")
            .select("id, email")
            .eq("email", targetEmail)
            .maybeSingle();
          if (studentRecord) {
            isAuthorized = true;
          }
        }
      }

      if (!isAuthorized) {
        return res.status(401).json({
          success: false,
          error: "Authorization required: you must be signed in with the corresponding student account to send registration emails.",
        });
      }

      welcomeEmailTargetMap.set(targetEmail, now);

      const html = generateWelcomeEmail({
        name: String(name || "Student").replace(/[<>]/g, "").trim(),
        email: targetEmail,
        selectedTrack: String(selectedTrack || "Exam Prep").replace(/[<>]/g, "").trim(),
        dreamUniversity: String(dreamUniversity || "").replace(/[<>]/g, "").trim(),
      });

      const sendRes = await sendEmail({
        to: targetEmail,
        subject: `Welcome to Boardly! Your Registration for ${selectedTrack || 'Exam Prep'} is Confirmed`,
        html,
      });

      return res.status(200).json({ success: sendRes.success, error: sendRes.error });
    } catch (err: any) {
      console.error("[api/send-welcome-email error]:", err);
      return res.status(500).json({ success: false, error: err?.message || "Error sending welcome email." });
    }
  });

  // In-memory payment requests fallback store (when Supabase payment_requests table is not provisioned)
  const inMemoryPaymentRequests: any[] = [];

  // API Endpoint: Submit Payment Request (WhatsApp / Direct Proof Verification Flow)
  app.post(
    "/api/payment-requests/submit",
    (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const contentType = req.headers['content-type'] || '';
      if (contentType.includes('multipart/form-data')) {
        (driveUploadMulter.single('file') as any)(req, res, next);
      } else {
        express.json()(req, res, next);
      }
    },
    async (req: express.Request, res: express.Response) => {
      try {
        const {
          student_id,
          student_name,
          studentEmail,
          student_email,
          studentName,
          payment_method,
          paymentMethod,
          amount,
          transaction_reference,
          transactionRef,
          course_tier,
          tier
        } = req.body || {};

        const resolvedStudentId = student_id || `anon-${Date.now()}`;
        const resolvedName = student_name || studentName || 'Student';
        const resolvedEmail = (student_email || studentEmail || '').toLowerCase().trim();
        const resolvedMethod = payment_method || paymentMethod || 'JazzCash';
        const resolvedAmount = amount || '0';
        const resolvedTrx = (transaction_reference || transactionRef || '').trim();
        const resolvedTier = course_tier || tier || '';

        if (!resolvedEmail || !resolvedMethod || !resolvedAmount) {
          return res.status(400).json({ success: false, error: "Missing required fields: student_email, payment_method, amount." });
        }

        let driveFileId = `wa-${Date.now()}`;
        let driveFileUrl = "WhatsApp Submission (+923222314436)";
        let proofUrl: string | undefined = undefined;

        if (req.file && req.file.buffer) {
          try {
            ensurePastPapersDirs();
            const ext = (req.file.originalname || "image.png").split(".").pop()?.toLowerCase() || "png";
            const sanitizedExt = ["jpg", "jpeg", "png", "webp", "gif", "pdf"].includes(ext) ? ext : "png";
            const filename = `proof-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${sanitizedExt}`;
            const filePath = path.join(UPLOADS_DIR, filename);
            fs.writeFileSync(filePath, req.file.buffer);

            driveFileId = filename;
            driveFileUrl = `/api/drive-file/${filename}`;
            proofUrl = driveFileUrl;
            console.log(`✅ [Payment Proof Upload Saved]: Saved ${req.file.originalname} (${req.file.size} bytes) -> ${driveFileUrl}`);
          } catch (fileErr) {
            console.error("[Payment Proof File Save Error]:", fileErr);
          }
        }

        const supabaseAdmin = getSupabaseAdminClient() || getAuthClient(req);
        
        let targetStudentUuid: string | null = null;
        if (resolvedStudentId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resolvedStudentId)) {
          targetStudentUuid = resolvedStudentId;
        }

        if (supabaseAdmin && (!targetStudentUuid || targetStudentUuid.startsWith('anon-'))) {
          try {
            const { data: matchedStudent } = await supabaseAdmin
              .from('students')
              .select('id')
              .eq('email', resolvedEmail)
              .maybeSingle();
            if (matchedStudent?.id) {
              targetStudentUuid = matchedStudent.id;
            }
          } catch (stFindErr) {
            console.warn('[Find Student UUID error]:', stFindErr);
          }
        }

        const recordUuid = crypto.randomUUID();
        const newRecord: Record<string, any> = {
          id: recordUuid,
          student_id: targetStudentUuid || undefined,
          student_name: String(resolvedName),
          student_email: String(resolvedEmail),
          transaction_ref: String(resolvedTrx),
          package_name: String(resolvedTier),
          status: 'pending',
          proof_url: proofUrl,
          screenshot_url: proofUrl,
          payment_proof_url: proofUrl,
          submitted_at: new Date().toISOString(),
        };

        // Also keep legacy fields in memory for response object / emails
        const responseData = {
          ...newRecord,
          payment_method: String(resolvedMethod),
          amount: Number(resolvedAmount) || resolvedAmount,
          drive_file_id: driveFileId,
          drive_file_url: driveFileUrl,
          proof_url: proofUrl,
          screenshot_url: proofUrl,
          payment_proof_url: proofUrl,
          transaction_reference: String(resolvedTrx),
          course_tier: resolvedTier || undefined,
          admin_note: resolvedTier ? `Class / Track: ${resolvedTier}` : undefined,
          created_at: newRecord.submitted_at,
        };

      let insertedData = responseData;
      inMemoryPaymentRequests.unshift(responseData);

      if (supabaseAdmin) {
        try {
          let { data, error } = await supabaseAdmin
            .from('payment_requests')
            .insert(newRecord)
            .select('*')
            .single();

          if (error && (error.code === '23503' || error.code === '22P02')) {
            console.warn('[payment_requests FK retry] student_id invalid or not found in students table, retrying with student_id: null...', error.message);
            const retryRes = await supabaseAdmin
              .from('payment_requests')
              .insert({ ...newRecord, student_id: null })
              .select('*')
              .single();
            data = retryRes.data;
            error = retryRes.error;
          }

          if (error) {
            console.error("[Supabase Insert Error payment_requests - FULL ERROR OBJECT]:", JSON.stringify(error, null, 2), error);
          } else if (data) {
            insertedData = { ...responseData, ...data };
            console.log("✅ [payment_requests] Row successfully created in Supabase:", data);
          }
        } catch (dbErr: any) {
          console.error("[Supabase Insert Exception payment_requests - FULL ERROR OBJECT]:", dbErr);
        }

        // Update student profile payment status to Pending Verification
        try {
          await supabaseAdmin
            .from('students')
            .update({
              payment_status: 'Pending Verification',
              requires_payment: true,
              updated_at: new Date().toISOString(),
            })
            .or(`id.eq.${resolvedStudentId},email.eq.${resolvedEmail}`);
        } catch (stErr) {
          console.warn("[Error updating student payment_status]:", stErr);
        }
      }

      // 1) Send Student Confirmation Email (Async non-blocking)
      const studentEmailHtml = generateSubmissionConfirmationEmail({
        name: newRecord.student_name,
        email: newRecord.student_email,
        method: responseData.payment_method,
        amount: responseData.amount,
        date: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
        track: responseData.course_tier || resolvedTier,
        transactionRef: responseData.transaction_reference || resolvedTrx,
      });

      sendEmailAsync({
        to: newRecord.student_email,
        subject: "✅ We've received your payment proof — Boardly",
        html: studentEmailHtml,
      });

      // 2) Send Admin Notification Email (Async non-blocking)
      const hostHeader = req.get('host') || 'localhost:3000';
      const protocol = req.protocol || 'http';
      const adminUrl = `${protocol}://${hostHeader}/#admin-payment-requests`;

      const adminEmailHtml = generateAdminPaymentNotificationEmail({
        name: newRecord.student_name,
        email: newRecord.student_email,
        method: responseData.payment_method,
        amount: responseData.amount,
        date: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
        transactionRef: responseData.transaction_reference || resolvedTrx,
        track: responseData.course_tier || resolvedTier,
        adminUrl,
      });

      sendEmailAsync({
        to: "shsvirtualadmin@gmail.com",
        subject: `🔔 New Payment Proof Submitted — ${newRecord.student_name}`,
        html: adminEmailHtml,
      });

      return res.status(200).json({
        success: true,
        data: insertedData,
        driveFileUrl,
        emailsSent: {
          student: true,
          admin: true,
        }
      });
    } catch (err: any) {
      console.error("[api/payment-requests/submit error]:", err);
      return res.status(500).json({ success: false, error: err?.message || "Internal server error submitting payment request." });
    }
  });

  // API Endpoint: Get Student Payment Requests
  app.get("/api/payment-requests/student/:student_id", async (req: express.Request, res: express.Response) => {
    try {
      const studentId = req.params.student_id;
      const supabaseAdmin = getSupabaseAdminClient() || getAuthClient(req);

      let list: any[] = [];
      if (supabaseAdmin) {
        try {
          let { data, error } = await supabaseAdmin
            .from('payment_requests')
            .select('*')
            .eq('student_id', studentId)
            .order('submitted_at', { ascending: false });

          if (error && error.message?.includes('submitted_at')) {
            const res2 = await supabaseAdmin
              .from('payment_requests')
              .select('*')
              .eq('student_id', studentId);
            data = res2.data;
            error = res2.error;
          }

          if (!error && Array.isArray(data)) {
            list = data;
          }
        } catch (e) {
          console.warn("Error fetching student payment_requests from Supabase:", e);
        }
      }

      // Merge in-memory payment requests matching student_id
      const memoryMatching = inMemoryPaymentRequests.filter(
        (r) => String(r.student_id) === String(studentId)
      );
      const existingIds = new Set(list.map((r) => r.id));
      for (const mem of memoryMatching) {
        if (!existingIds.has(mem.id)) {
          list.push(mem);
        }
      }

      return res.status(200).json({ success: true, requests: list });
    } catch (err: any) {
      console.error("Error in get student payment requests:", err);
      return res.status(500).json({ success: false, error: err?.message || "Server error" });
    }
  });

  // API Endpoint: Admin Fetch All Payment Requests
  app.get("/api/admin/payment-requests", async (req: express.Request, res: express.Response) => {
    try {
      const supabaseAdmin = getSupabaseAdminClient() || getAuthClient(req);

      let list: any[] = [];
      if (supabaseAdmin) {
        try {
          let { data, error } = await supabaseAdmin
            .from('payment_requests')
            .select('*')
            .order('submitted_at', { ascending: false });

          if (error && error.message?.includes('submitted_at')) {
            const res2 = await supabaseAdmin
              .from('payment_requests')
              .select('*');
            data = res2.data;
            error = res2.error;
          }

          if (!error && Array.isArray(data)) {
            list = data;
          }
        } catch (e) {
          console.warn("Error fetching all payment_requests from Supabase:", e);
        }
      }

      const existingIds = new Set(list.map((r) => r.id));
      for (const mem of inMemoryPaymentRequests) {
        if (!existingIds.has(mem.id)) {
          list.push(mem);
        }
      }

      return res.status(200).json({ success: true, requests: list });
    } catch (err: any) {
      console.error("Error in admin fetch payment requests:", err);
      return res.status(500).json({ success: false, error: err?.message || "Server error" });
    }
  });

  // API Endpoint: Admin Review Payment Request (Approve / Reject)
  app.post("/api/admin/payment-requests/review", async (req: express.Request, res: express.Response) => {
    try {
      const { requestId, status, adminNote, reviewerEmail } = req.body || {};

      if (!requestId || !status || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ success: false, error: "Invalid parameters. Required: requestId, status ('approved'|'rejected')." });
      }

      const supabaseAdmin = getSupabaseAdminClient() || getAuthClient(req);

      let requestRow: any = null;

      if (supabaseAdmin) {
        try {
          const { data, error } = await supabaseAdmin
            .from('payment_requests')
            .select('*')
            .eq('id', requestId)
            .maybeSingle();

          if (!error && data) {
            requestRow = data;
          }
        } catch (e) {
          console.warn("Could not fetch payment_request from DB:", e);
        }
      }

      if (!requestRow) {
        requestRow = inMemoryPaymentRequests.find((r) => r.id === requestId);
      }

      if (!requestRow) {
        return res.status(404).json({ success: false, error: "Payment request record not found." });
      }

      // Update in memory record
      requestRow.status = status;
      requestRow.admin_note = adminNote || null;
      requestRow.reviewed_at = new Date().toISOString();
      requestRow.reviewed_by = reviewerEmail || 'shsvirtualadmin@gmail.com';

      if (supabaseAdmin) {
        try {
          await supabaseAdmin
            .from('payment_requests')
            .update({
              status,
              admin_note: adminNote || null,
              reviewed_at: new Date().toISOString(),
              reviewed_by: reviewerEmail || 'shsvirtualadmin@gmail.com',
            })
            .eq('id', requestId);
        } catch (updErr) {
          console.warn("Could not update payment_requests in DB:", updErr);
        }
      }

      // If approved, upgrade student status in Supabase
      if (status === 'approved') {
        const studentId = requestRow.student_id;
        const studentEmail = requestRow.student_email;

        const isDaily = Number(requestRow.amount) === 50 ||
                        String(requestRow.course_tier || '').toLowerCase().includes('daily') ||
                        String(requestRow.tier || '').toLowerCase().includes('daily') ||
                        String(requestRow.package_name || '').toLowerCase().includes('daily');
        const durationMs = isDaily ? (24 * 3600 * 1000) : (30 * 24 * 3600 * 1000);
        const packageName = requestRow.package_name || requestRow.course_tier || 'Boardly Premium Access';

        if (supabaseAdmin) {
          try {
            await supabaseAdmin
              .from('students')
              .update({
                is_pro: true,
                payment_status: 'Verified & Paid',
                requires_payment: false,
                package_name: packageName,
                status: 'active',
                access_expires: new Date(Date.now() + durationMs).toISOString(),
                updated_at: new Date().toISOString(),
              })
              .or(`id.eq.${studentId},email.eq.${studentEmail}`);
          } catch (stErr) {
            console.warn("Could not update student status in DB:", stErr);
          }
        }

        // Send Approval Email
        const appEmail = generatePaymentApprovedEmail({
          name: requestRow.student_name || 'Student',
          method: requestRow.payment_method,
          amount: requestRow.amount,
        });

        sendEmail({
          to: studentEmail,
          subject: "Payment Approved! Premium Access Active - Boardly",
          html: appEmail,
        }).catch(e => console.error("Error sending approval email:", e));
      } else {
        const studentId = requestRow.student_id;
        const studentEmail = requestRow.student_email;

        if (supabaseAdmin) {
          try {
            await supabaseAdmin
              .from('students')
              .update({
                payment_status: 'Rejected',
                requires_payment: true,
                updated_at: new Date().toISOString(),
              })
              .or(`id.eq.${studentId},email.eq.${studentEmail}`);
          } catch (rejErr) {
            console.warn("[Error updating student payment_status on rejection]:", rejErr);
          }
        }

        // Send Rejection Email
        const rejEmail = generatePaymentRejectedEmail({
          name: requestRow.student_name || 'Student',
          method: requestRow.payment_method,
          amount: requestRow.amount,
          adminNote,
        });

        sendEmail({
          to: requestRow.student_email,
          subject: "Update Regarding Your Payment Request - Boardly",
          html: rejEmail,
        }).catch(e => console.error("Error sending rejection email:", e));
      }

      // Record Activity Log on payment request review
      const logRecord = {
        id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        admin_email: reviewerEmail || 'shsvirtualadmin@gmail.com',
        target_student_id: requestRow.student_id,
        target_student_name: requestRow.student_name || 'Student',
        target_student_email: requestRow.student_email,
        action_type: status === 'approved' ? 'payment_approved' : 'payment_rejected',
        old_plan: 'Pending Verification',
        new_plan: status === 'approved' ? 'Verified & Paid (Boardly Premium)' : 'Payment Rejected',
        note: adminNote || (status === 'approved' ? `Approved manual payment of PKR ${requestRow.amount}` : 'Rejected payment submission'),
        created_at: new Date().toISOString(),
      };
      try {
        await supabaseAdmin.from('admin_activity_logs').insert([logRecord]);
      } catch (logErr) {
        console.warn("Notice: admin_activity_logs table insert skipped, saving in memory:", logErr);
      }
      memoryActivityLogs.unshift(logRecord);

      return res.status(200).json({
        success: true,
        message: status === 'approved' ? 'Payment request approved and student upgraded to Premium!' : 'Payment request rejected.',
      });
    } catch (err: any) {
      console.error("Error reviewing payment request:", err);
      return res.status(500).json({ success: false, error: err?.message || "Internal server error reviewing payment request." });
    }
  });

  // In-memory activity logs store fallback
  const memoryActivityLogs: Array<{
    id: string;
    admin_email: string;
    target_student_id: string;
    target_student_name: string;
    target_student_email: string;
    action_type: string;
    old_plan: string;
    new_plan: string;
    note?: string;
    created_at: string;
  }> = [];

  // API Endpoint: Admin Manual Plan Change (Grant / Change Student Subscription Plan)
  app.post("/api/admin/update-student-plan", async (req: express.Request, res: express.Response) => {
    res.setHeader('Content-Type', 'application/json');
    try {
      const {
        studentId,
        studentEmail,
        subscribedPlans,
        assignedClasses,
        packageName,
        paymentStatus = 'Verified & Paid',
        isPro,
        expirationMonths = 12,
        adminNote,
        adminEmail
      } = req.body || {};

      // Server-side strict authorization check: Admin role verification
      const { user: tokenUser, isAdmin: isTokenAdmin } = await verifyAuthToken(req);
      const requestedByEmail = (adminEmail || tokenUser?.email || "").trim().toLowerCase();
      const isAdmin = isTokenAdmin || isAdminEmail(requestedByEmail);

      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          error: "Forbidden: Manual plan changes are strictly restricted to authorized administrators."
        });
      }

      if ((!studentId && !studentEmail) || !Array.isArray(subscribedPlans) || !packageName) {
        return res.status(400).json({
          success: false,
          error: "Invalid request parameters. Required: studentId or studentEmail, subscribedPlans (array), packageName."
        });
      }

      const supabaseAdmin = getSupabaseAdminClient() || getAuthClient(req);
      if (!supabaseAdmin) {
        return res.status(500).json({ success: false, error: "Database client unavailable." });
      }

      // Fetch existing student profile to get old plan details
      let currentStudent: any = null;
      const searchId = studentId && !studentId.includes('@') ? studentId : null;
      const searchEmail = studentEmail || (studentId && studentId.includes('@') ? studentId : null);

      if (searchId) {
        const { data: sById } = await supabaseAdmin.from('students').select('*').eq('id', searchId).maybeSingle();
        if (sById) currentStudent = sById;
      }

      if (!currentStudent && searchEmail) {
        const { data: sByEmail } = await supabaseAdmin.from('students').select('*').eq('email', searchEmail).maybeSingle();
        if (sByEmail) currentStudent = sByEmail;
      }

      if (!currentStudent) {
        return res.status(404).json({ success: false, error: "Student record not found." });
      }

      const oldPlan = currentStudent.package_name || (currentStudent.subscribed_plans && currentStudent.subscribed_plans.join(', ')) || 'Free Plan';
      
      const isFree = (subscribedPlans.includes('free') && subscribedPlans.length === 1) || isPro === false;
      const finalIsPro = typeof isPro === 'boolean' ? isPro : !isFree;
      const finalPaymentStatus = finalIsPro ? 'Verified & Paid' : 'Free Plan';
      const finalRequiresPayment = !finalIsPro;
      const finalPlanStatus = finalIsPro ? 'verified_pro' : 'trial';

      const expMonths = Number(expirationMonths) || 1;
      const isDailyPlan = String(packageName || '').toLowerCase().includes('daily') || expMonths < 0.1;
      const durationMs = isDailyPlan ? (24 * 3600 * 1000) : (expMonths * 30 * 24 * 3600 * 1000);
      const accessExpiresStr = finalIsPro
        ? new Date(Date.now() + durationMs).toISOString()
        : new Date().toISOString();

      const planData = {
        subscribed_plans: finalIsPro ? subscribedPlans : ['free'],
        is_pro: finalIsPro,
        package_name: finalIsPro ? packageName : 'Free Plan',
        payment_status: finalPaymentStatus,
        plan_status: finalPlanStatus,
        requires_payment: finalRequiresPayment,
        access_expires: accessExpiresStr,
        status: 'active',
        updated_at: new Date().toISOString(),
      };

      console.log(`[DEBUG: Plan Update BEFORE] Student ID: ${currentStudent.id}, Email: ${currentStudent.email}`, {
        oldPlan,
        subscribed_plans: currentStudent.subscribed_plans,
        payment_status: currentStudent.payment_status,
        requires_payment: currentStudent.requires_payment,
        is_pro: currentStudent.is_pro,
      });

      let updateSuccess = false;
      let dbWriteError = null;

      const dbUpdatePayload: any = {
        subscribed_plans: finalIsPro ? subscribedPlans : ['free'],
        is_pro: finalIsPro,
        plan_tier: finalIsPro ? 'pro' : 'free',
        package_name: finalIsPro ? packageName : 'Free Plan',
        payment_status: finalPaymentStatus,
        plan_status: finalPlanStatus,
        requires_payment: finalRequiresPayment,
        access_expires: accessExpiresStr,
        status: 'active',
        updated_at: new Date().toISOString(),
      };

      if (Array.isArray(assignedClasses)) {
        dbUpdatePayload.assigned_classes = assignedClasses;
        if (assignedClasses.length > 0) {
          const topClass = String(assignedClasses[0]).toUpperCase();
          if (topClass.includes('NET') || topClass.includes('NUST')) {
            dbUpdatePayload.grade = 'NET';
            dbUpdatePayload.stream = 'NUST NET Engineering & Computing';
            dbUpdatePayload.target_university = 'NUST Islamabad';
          } else if (topClass.includes('FAST')) {
            dbUpdatePayload.grade = 'FAST';
            dbUpdatePayload.stream = 'FAST-NU CS & Engineering';
            dbUpdatePayload.target_university = 'FAST-NUCES';
          } else if (topClass.includes('NAT') || topClass.includes('NTS')) {
            dbUpdatePayload.grade = 'NAT';
            dbUpdatePayload.stream = 'NAT-IE (Pre-Engineering)';
            dbUpdatePayload.target_university = 'COMSATS / Air / Bahria / IIUI / IST';
          } else if (topClass.includes('NED')) {
            dbUpdatePayload.grade = 'NED';
            dbUpdatePayload.stream = 'NED Pre-Engineering';
            dbUpdatePayload.target_university = 'NED University Karachi';
          } else if (topClass.includes('PIEAS')) {
            dbUpdatePayload.grade = 'PIEAS';
            dbUpdatePayload.stream = 'PIEAS Pre-Engineering';
            dbUpdatePayload.target_university = 'PIEAS Islamabad';
          } else if (topClass.includes('IBA')) {
            dbUpdatePayload.grade = 'IBA';
            dbUpdatePayload.stream = 'Undergraduate Aptitude';
            dbUpdatePayload.target_university = 'IBA Karachi';
          } else if (topClass.includes('AKU') || topClass.includes('AGA KHAN')) {
            dbUpdatePayload.grade = 'AKU';
            dbUpdatePayload.stream = 'AKU MBBS & Nursing';
            dbUpdatePayload.target_university = 'Aga Khan University';
          } else if (topClass.includes('MUET') || topClass.includes('MEHRAN')) {
            dbUpdatePayload.grade = 'MUET';
            dbUpdatePayload.stream = 'MUET Pre-Engineering';
            dbUpdatePayload.target_university = 'MUET Jamshoro';
          } else if (topClass.includes('LUMS')) {
            dbUpdatePayload.grade = 'LUMS';
            dbUpdatePayload.stream = 'LCAT Aptitude Stream';
            dbUpdatePayload.target_university = 'LUMS Lahore';
          } else if (topClass.includes('NUML')) {
            dbUpdatePayload.grade = 'NUML';
            dbUpdatePayload.stream = 'Engineering & CS';
            dbUpdatePayload.target_university = 'NUML Islamabad';
          } else if (topClass.includes('HITEC')) {
            dbUpdatePayload.grade = 'HITEC';
            dbUpdatePayload.stream = 'Engineering Stream';
            dbUpdatePayload.target_university = 'HITEC University Taxila';
          } else if (topClass.includes('NUTECH') || topClass.includes('NUET')) {
            dbUpdatePayload.grade = 'NUTECH';
            dbUpdatePayload.stream = 'NUET Engineering Stream';
            dbUpdatePayload.target_university = 'NUTECH Islamabad';
          } else if (topClass.includes('ECAT')) {
            dbUpdatePayload.grade = 'ECAT';
            dbUpdatePayload.stream = 'ECAT Engineering Group';
            dbUpdatePayload.target_university = 'UET Lahore';
          } else if (topClass.includes('ETEA')) {
            dbUpdatePayload.grade = 'ETEA';
            dbUpdatePayload.stream = 'ETEA Engineering Group';
            dbUpdatePayload.target_university = 'UET Peshawar';
          } else if (topClass.includes('NUMS')) {
            dbUpdatePayload.grade = 'NUMS';
            dbUpdatePayload.stream = 'NUMS Medical Entry Test';
            dbUpdatePayload.target_university = 'Army Medical College (NUMS)';
          } else if (topClass.includes('GIKI')) {
            dbUpdatePayload.grade = 'GIKI';
            dbUpdatePayload.stream = 'GIKI Engineering Entrance';
            dbUpdatePayload.target_university = 'GIKI Topi';
          } else if (topClass.includes('USAT')) {
            dbUpdatePayload.grade = 'USAT';
            dbUpdatePayload.stream = 'USAT-E (Pre-Engineering)';
            dbUpdatePayload.target_university = 'HEC Recognized Universities';
          } else if (topClass.includes('MDCAT')) {
            dbUpdatePayload.grade = 'MDCAT';
            dbUpdatePayload.stream = 'MDCAT Stream';
            dbUpdatePayload.target_university = 'King Edward / UHS / PMDC';
          } else if (topClass.includes('TCAT')) {
            dbUpdatePayload.grade = 'TCAT';
            dbUpdatePayload.stream = 'TCAT Stream';
            dbUpdatePayload.target_university = 'UET Taxila';
          } else if (topClass.includes('9')) {
            dbUpdatePayload.grade = '9th';
            dbUpdatePayload.stream = 'Science';
          } else if (topClass.includes('10')) {
            dbUpdatePayload.grade = '10th';
            dbUpdatePayload.stream = 'Science';
          } else if (topClass.includes('11')) {
            dbUpdatePayload.grade = '11th';
            dbUpdatePayload.stream = topClass.includes('MEDICAL') ? 'Pre-Medical Stream' : (topClass.includes('ICS') ? 'ICS Stream' : 'Pre-Engineering Stream');
          } else if (topClass.includes('12')) {
            dbUpdatePayload.grade = '12th';
            dbUpdatePayload.stream = topClass.includes('MEDICAL') ? 'Pre-Medical Stream' : (topClass.includes('ICS') ? 'ICS Stream' : 'Pre-Engineering Stream');
          }
        }
      }

      if (!dbUpdatePayload.grade && Array.isArray(subscribedPlans) && subscribedPlans.length > 0) {
        const p = String(subscribedPlans[0]).toLowerCase();
        if (p === 'net') {
          dbUpdatePayload.grade = 'NET';
          dbUpdatePayload.stream = 'NUST NET Engineering & Computing';
          dbUpdatePayload.target_university = 'NUST Islamabad';
        } else if (p === 'fast') {
          dbUpdatePayload.grade = 'FAST';
          dbUpdatePayload.stream = 'FAST-NU CS & Engineering';
          dbUpdatePayload.target_university = 'FAST-NUCES';
        } else if (p === 'mdcat') {
          dbUpdatePayload.grade = 'MDCAT';
          dbUpdatePayload.stream = 'MDCAT Stream';
          dbUpdatePayload.target_university = 'King Edward / UHS / PMDC';
        } else if (p === 'tcat') {
          dbUpdatePayload.grade = 'TCAT';
          dbUpdatePayload.stream = 'TCAT Stream';
          dbUpdatePayload.target_university = 'UET Taxila';
        } else if (p === 'ecat') {
          dbUpdatePayload.grade = 'ECAT';
          dbUpdatePayload.stream = 'ECAT Engineering Group';
          dbUpdatePayload.target_university = 'UET Lahore';
        } else if (p === 'etea') {
          dbUpdatePayload.grade = 'ETEA';
          dbUpdatePayload.stream = 'ETEA Engineering Group';
          dbUpdatePayload.target_university = 'UET Peshawar';
        } else if (p === 'nums') {
          dbUpdatePayload.grade = 'NUMS';
          dbUpdatePayload.stream = 'NUMS Medical Entry Test';
          dbUpdatePayload.target_university = 'Army Medical College (NUMS)';
        } else if (p === 'giki') {
          dbUpdatePayload.grade = 'GIKI';
          dbUpdatePayload.stream = 'GIKI Engineering Entrance';
          dbUpdatePayload.target_university = 'GIKI Topi';
        } else if (p === 'usat') {
          dbUpdatePayload.grade = 'USAT';
          dbUpdatePayload.stream = 'USAT-E (Pre-Engineering)';
          dbUpdatePayload.target_university = 'HEC Recognized Universities';
        } else if (p === 'ned') {
          dbUpdatePayload.grade = 'NED';
          dbUpdatePayload.stream = 'NED Pre-Engineering';
          dbUpdatePayload.target_university = 'NED University Karachi';
        } else if (p === 'pieas') {
          dbUpdatePayload.grade = 'PIEAS';
          dbUpdatePayload.stream = 'PIEAS Pre-Engineering';
          dbUpdatePayload.target_university = 'PIEAS Islamabad';
        } else if (p === 'nat') {
          dbUpdatePayload.grade = 'NAT';
          dbUpdatePayload.stream = 'NAT-IE (Pre-Engineering)';
          dbUpdatePayload.target_university = 'COMSATS / Air / Bahria / IIUI / IST';
        } else if (p === 'iba') {
          dbUpdatePayload.grade = 'IBA';
          dbUpdatePayload.stream = 'Undergraduate Aptitude';
          dbUpdatePayload.target_university = 'IBA Karachi';
        } else if (p === 'aku') {
          dbUpdatePayload.grade = 'AKU';
          dbUpdatePayload.stream = 'AKU MBBS & Nursing';
          dbUpdatePayload.target_university = 'Aga Khan University';
        } else if (p === 'muet') {
          dbUpdatePayload.grade = 'MUET';
          dbUpdatePayload.stream = 'MUET Pre-Engineering';
          dbUpdatePayload.target_university = 'MUET Jamshoro';
        } else if (p === 'lums') {
          dbUpdatePayload.grade = 'LUMS';
          dbUpdatePayload.stream = 'LCAT Aptitude Stream';
          dbUpdatePayload.target_university = 'LUMS Lahore';
        } else if (p === 'numl') {
          dbUpdatePayload.grade = 'NUML';
          dbUpdatePayload.stream = 'Engineering & CS';
          dbUpdatePayload.target_university = 'NUML Islamabad';
        } else if (p === 'hitec') {
          dbUpdatePayload.grade = 'HITEC';
          dbUpdatePayload.stream = 'Engineering Stream';
          dbUpdatePayload.target_university = 'HITEC University Taxila';
        } else if (p === 'nutech') {
          dbUpdatePayload.grade = 'NUTECH';
          dbUpdatePayload.stream = 'NUET Engineering Stream';
          dbUpdatePayload.target_university = 'NUTECH Islamabad';
        } else if (p === 'fbise_9') {
          dbUpdatePayload.grade = '9th';
          dbUpdatePayload.stream = 'Science';
        } else if (p === 'fbise_10') {
          dbUpdatePayload.grade = '10th';
          dbUpdatePayload.stream = 'Science';
        } else if (p.includes('11') && p.includes('med')) {
          dbUpdatePayload.grade = '11th';
          dbUpdatePayload.stream = 'Pre-Medical Stream';
        } else if (p.includes('11') && p.includes('ics')) {
          dbUpdatePayload.grade = '11th';
          dbUpdatePayload.stream = 'ICS Stream';
        } else if (p.includes('11')) {
          dbUpdatePayload.grade = '11th';
          dbUpdatePayload.stream = 'Pre-Engineering Stream';
        } else if (p.includes('12') && p.includes('med')) {
          dbUpdatePayload.grade = '12th';
          dbUpdatePayload.stream = 'Pre-Medical Stream';
        } else if (p.includes('12') && p.includes('ics')) {
          dbUpdatePayload.grade = '12th';
          dbUpdatePayload.stream = 'ICS Stream';
        } else if (p.includes('12')) {
          dbUpdatePayload.grade = '12th';
          dbUpdatePayload.stream = 'Pre-Engineering Stream';
        }
      }

      if (finalIsPro) {
        dbUpdatePayload.tests_used_this_month = 0;
        dbUpdatePayload.ai_messages_used_today = 0;
      }

      try {
        const { data: uData, error: uErr } = await supabaseAdmin
          .from('students')
          .update(dbUpdatePayload)
          .eq('id', currentStudent.id)
          .select();
        if (!uErr && uData && uData.length > 0) {
          updateSuccess = true;
        } else if (uErr) {
          dbWriteError = uErr.message;
        }
      } catch (e: any) {
        dbWriteError = e?.message || String(e);
      }

      // Verify DB state after write
      let verifiedData: any = null;
      try {
        const { data: vData } = await supabaseAdmin
          .from('students')
          .select('*')
          .eq('id', currentStudent.id)
          .maybeSingle();
        verifiedData = vData;
      } catch (vErr) {}

      console.log(`[DEBUG: Plan Update WRITTEN TO DB] Student ID: ${currentStudent.id}, Email: ${currentStudent.email}`, {
        updateSuccess,
        verifiedDBRow: verifiedData ? {
          id: verifiedData.id,
          subscribed_plans: verifiedData.subscribed_plans,
          payment_status: verifiedData.payment_status,
          requires_payment: verifiedData.requires_payment,
          package_name: verifiedData.package_name,
          is_pro: verifiedData.is_pro,
        } : 'NONE',
      });

      if (!updateSuccess && !verifiedData) {
        return res.status(500).json({
          success: false,
          error: `Failed to commit plan update to database. ${dbWriteError ? 'Database Error: ' + dbWriteError : ''}`
        });
      }

      const parseArrayHelper = (val: any, fallback: string[]) => {
        if (Array.isArray(val)) return val;
        if (typeof val === 'string' && val.trim()) {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) return parsed;
          } catch {
            return [val];
          }
        }
        return fallback;
      };

      const finalProfile = verifiedData
        ? {
            ...currentStudent,
            ...verifiedData,
            subscribed_plans: parseArrayHelper(verifiedData.subscribed_plans, subscribedPlans),
            assigned_classes: parseArrayHelper(verifiedData.assigned_classes, Array.isArray(assignedClasses) ? assignedClasses : []),
            is_pro: typeof verifiedData.is_pro === 'boolean' ? verifiedData.is_pro : finalIsPro,
            package_name: verifiedData.package_name || packageName,
            payment_status: verifiedData.payment_status || finalPaymentStatus,
            requires_payment: typeof verifiedData.requires_payment === 'boolean' ? verifiedData.requires_payment : finalRequiresPayment,
          }
        : { ...currentStudent, ...planData };

      console.log(`[DEBUG: Plan Update API RESPONSE] Student ID: ${currentStudent.id}`, {
        success: true,
        returnedProfile: {
          id: finalProfile.id,
          subscribed_plans: finalProfile.subscribed_plans,
          payment_status: finalProfile.payment_status,
          requires_payment: finalProfile.requires_payment,
          is_pro: finalProfile.is_pro,
          package_name: finalProfile.package_name,
        }
      });

      // Record Activity Log
      const logRecord = {
        id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        admin_email: requestedByEmail || 'shsvirtualadmin@gmail.com',
        target_student_id: currentStudent.id,
        target_student_name: currentStudent.name || 'Student',
        target_student_email: currentStudent.email,
        action_type: 'manual_plan_change',
        old_plan: oldPlan,
        new_plan: packageName,
        note: adminNote || 'Manual subscription plan override by administrator',
        created_at: new Date().toISOString(),
      };

      try {
        await supabaseAdmin.from('admin_activity_logs').insert([logRecord]);
      } catch (logErr) {
        console.warn("Notice: admin_activity_logs table insert skipped, saving in memory:", logErr);
      }
      memoryActivityLogs.unshift(logRecord);

      return res.status(200).json({
        success: true,
        message: `Plan successfully updated to "${packageName}" for ${currentStudent.name || 'Student'}!`,
        profile: finalProfile
      });
    } catch (err: any) {
      console.error("Error updating student plan:", err);
      return res.status(500).json({ success: false, error: err?.message || "Internal server error." });
    }
  });

  // ==========================================
  // PROMOTIONAL & REFERRAL LINK ENGINE (1-YEAR FREE PRO)
  // ==========================================
  const PROMO_LINKS_FILE_PATH = path.join(process.cwd(), "data", "promo_links.json");

  interface PromoLinkRecord {
    id: string;
    code: string;
    label: string;
    discount_type: '1_year_free_pro';
    duration_months: number;
    max_redemptions: number | null;
    redemption_count: number;
    is_active: boolean;
    created_by: string;
    created_at: string;
    expires_at: string | null;
    redemptions: Array<{
      student_id: string;
      student_email: string;
      student_name: string;
      redeemed_at: string;
      track: string;
      granted_until: string;
    }>;
  }

  let inMemoryPromoLinks: PromoLinkRecord[] | null = null;

  function loadPromoLinks(): PromoLinkRecord[] {
    try {
      if (fs.existsSync(PROMO_LINKS_FILE_PATH)) {
        const raw = fs.readFileSync(PROMO_LINKS_FILE_PATH, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          inMemoryPromoLinks = parsed;
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Could not read promo_links.json, falling back to cache or empty array:", e);
    }
    if (inMemoryPromoLinks && Array.isArray(inMemoryPromoLinks)) {
      return inMemoryPromoLinks;
    }
    return [];
  }

  function savePromoLinks(data: PromoLinkRecord[]): void {
    inMemoryPromoLinks = data;
    try {
      const dir = path.dirname(PROMO_LINKS_FILE_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(PROMO_LINKS_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to write promo_links.json:", e);
    }
  }

  // Anti-stacking validator: verifies whether this student account has already redeemed ANY 1-year promo link
  function hasStudentAlreadyRedeemedPromo(
    studentId?: string,
    studentEmail?: string,
    links: PromoLinkRecord[] = [],
    currentStudent?: any
  ): boolean {
    const cleanId = (studentId || "").trim();
    const cleanEmail = (studentEmail || "").trim().toLowerCase();

    // 1. Check all redemptions across all promo campaigns
    for (const link of links) {
      if (Array.isArray(link.redemptions)) {
        for (const r of link.redemptions) {
          if (
            (cleanId && r.student_id === cleanId) ||
            (cleanEmail && r.student_email && r.student_email.trim().toLowerCase() === cleanEmail)
          ) {
            return true;
          }
        }
      }
    }

    // 2. Check current student database record
    if (currentStudent) {
      if (currentStudent.promo_code_redeemed || currentStudent.promo_redeemed_at) {
        return true;
      }
    }

    return false;
  }

  // API Endpoint: Validate Promo Code
  app.get("/api/promo/validate", async (req: express.Request, res: express.Response) => {
    try {
      const code = String(req.query.code || "").trim().toUpperCase();
      if (!code) {
        return res.status(400).json({ valid: false, error: "Promo code parameter required." });
      }

      const links = loadPromoLinks();
      let link = links.find((l) => l.code.toUpperCase() === code);

      const studentId = String(req.query.studentId || "").trim();
      const studentEmail = String(req.query.studentEmail || "").trim().toLowerCase();

      const supabaseAdmin = getSupabaseAdminClient() || getAuthClient(req) || supabaseServer;

      // Check promo_codes table in Supabase
      let dbCodeRow: any = null;
      if (supabaseAdmin) {
        try {
          const { data } = await supabaseAdmin.from("promo_codes").select("*").ilike("code", code).maybeSingle();
          if (data) dbCodeRow = data;
        } catch {}
      }

      if (!link && !dbCodeRow) {
        // Fallback for recognized campaign prefix
        if (code.startsWith("BOARDLY") || code.startsWith("PRO-") || code.includes("PRO")) {
          link = {
            id: "promo_dyn_" + code,
            code: code,
            label: "1-Year Free Boardly Pro Campaign",
            discount_type: "1_year_free_pro",
            duration_months: 12,
            max_redemptions: 1,
            redemption_count: 0,
            is_active: true,
            created_by: "system",
            created_at: new Date().toISOString(),
            expires_at: null,
            redemptions: [],
          };
        } else {
          return res.status(404).json({ valid: false, error: "Promotional code not found." });
        }
      }

      const activeLabel = dbCodeRow?.label || link?.label || "1-Year Free Boardly Pro Campaign";

      // Check if THIS student account already redeemed this code or any promo link
      let alreadyRedeemed = false;
      let existingExpiry: string | null = null;

      if (link && Array.isArray(link.redemptions)) {
        for (const r of link.redemptions) {
          if (
            (studentId && r.student_id === studentId) ||
            (studentEmail && r.student_email && r.student_email.trim().toLowerCase() === studentEmail)
          ) {
            alreadyRedeemed = true;
            existingExpiry = r.granted_until || null;
            break;
          }
        }
      }

      // Check promo_redemptions table in Supabase
      if (supabaseAdmin && (studentId || studentEmail)) {
        try {
          let q = supabaseAdmin.from("promo_redemptions").select("*");
          if (studentEmail && studentId) {
            q = q.or(`student_email.ilike.${studentEmail},email.ilike.${studentEmail},student_id.eq.${studentId},user_id.eq.${studentId}`);
          } else if (studentEmail) {
            q = q.or(`student_email.ilike.${studentEmail},email.ilike.${studentEmail}`);
          } else {
            q = q.or(`student_id.eq.${studentId},user_id.eq.${studentId}`);
          }
          const { data: claims } = await q.limit(5);
          if (Array.isArray(claims) && claims.length > 0) {
            alreadyRedeemed = true;
            existingExpiry = claims[0].granted_until || claims[0].expires_at || null;
          }
        } catch {}
      }

      // Check profiles table in Supabase
      if (supabaseAdmin && (studentId || studentEmail)) {
        try {
          let profData: any = null;
          if (studentEmail) {
            const { data } = await supabaseAdmin.from("profiles").select("*").ilike("email", studentEmail).maybeSingle();
            if (data) profData = data;
          }
          if (!profData && studentId) {
            const { data } = await supabaseAdmin.from("profiles").select("*").eq("id", studentId).maybeSingle();
            if (data) profData = data;
          }
          if (profData && (profData.subscription_tier === "pro" || profData.is_pro || profData.promo_code_redeemed === code)) {
            alreadyRedeemed = true;
            existingExpiry = profData.subscription_expires_at || existingExpiry;
          }
        } catch {}
      }

      // Check supabase student record too if available
      let currentStudent: any = null;
      if (supabaseAdmin && (studentId || studentEmail)) {
        try {
          if (studentId && !studentId.includes("@")) {
            const { data } = await supabaseAdmin.from("students").select("*").eq("id", studentId).maybeSingle();
            if (data) currentStudent = data;
          }
          if (!currentStudent && studentEmail) {
            const { data } = await supabaseAdmin.from("students").select("*").eq("email", studentEmail).maybeSingle();
            if (data) currentStudent = data;
          }
        } catch (e) {}
      }

      if (!alreadyRedeemed && currentStudent) {
        if (
          currentStudent.promo_code_redeemed === code ||
          (currentStudent.transaction_reference && currentStudent.transaction_reference === `PROMO:${code}`) ||
          (currentStudent.is_pro && currentStudent.access_expires && hasStudentAlreadyRedeemedPromo(studentId, studentEmail, links, currentStudent))
        ) {
          alreadyRedeemed = true;
          existingExpiry = currentStudent.access_expires || null;
        }
      }

      if (alreadyRedeemed) {
        return res.status(200).json({
          valid: true,
          alreadyRedeemed: true,
          alreadyRedeemedByAccount: true,
          code: code,
          label: activeLabel,
          expiresDate: existingExpiry,
          grantedUntil: existingExpiry,
          message: `Already activated on this account (expires ${existingExpiry ? new Date(existingExpiry).toLocaleDateString() : 'in 1 year'}).`,
        });
      }

      const isActive = dbCodeRow ? dbCodeRow.is_active !== false : (link ? link.is_active !== false : true);
      if (!isActive) {
        return res.status(400).json({ valid: false, error: "This promotional link has been paused." });
      }

      const expiresAt = dbCodeRow?.expires_at || link?.expires_at;
      if (expiresAt && new Date(expiresAt).getTime() < Date.now()) {
        return res.status(400).json({ valid: false, error: "This promotional link has expired." });
      }

      const maxRedemptions = dbCodeRow?.max_redemptions ?? link?.max_redemptions;
      const redemptionCount = dbCodeRow?.redemption_count ?? link?.redemption_count ?? 0;
      if (maxRedemptions && redemptionCount >= maxRedemptions) {
        return res.status(400).json({
          valid: false,
          error: "This promotional link has already been used and is expired. Each promotional link is single-use and can only be claimed once.",
        });
      }

      const remainingRedemptions = link.max_redemptions ? Math.max(0, link.max_redemptions - link.redemption_count) : null;

      return res.status(200).json({
        valid: true,
        alreadyRedeemed: false,
        alreadyRedeemedByAccount: false,
        code: link.code,
        label: link.label,
        maxRedemptions: link.max_redemptions,
        redemptionCount: link.redemption_count,
        remainingRedemptions,
        expiresAt: link.expires_at,
      });
    } catch (err: any) {
      console.error("Error validating promo code:", err);
      return res.status(500).json({ valid: false, error: "Server error validating promo code." });
    }
  });

  // API Endpoint: Get Student Profile (with guaranteed Pro status if redeemed)
  app.get("/api/student-profile", async (req: express.Request, res: express.Response) => {
    try {
      const id = String(req.query.id || "").trim();
      const email = String(req.query.email || "").trim().toLowerCase();
      if (!id && !email) {
        return res.status(400).json({ error: "Student id or email required" });
      }

      const supabaseAdmin = getSupabaseAdminClient() || getAuthClient(req) || supabaseServer;
      let studentRecord: any = null;

      if (supabaseAdmin) {
        if (id && !id.includes("@")) {
          const { data } = await supabaseAdmin.from("students").select("*").eq("id", id).maybeSingle();
          if (data) studentRecord = data;
        }
        if (!studentRecord && email) {
          const { data } = await supabaseAdmin.from("students").select("*").eq("email", email).maybeSingle();
          if (data) studentRecord = data;
        }

        // Cross-check promo_redemptions in Supabase
        try {
          let redRow: any = null;
          if (id && !id.includes("@")) {
            const { data: r1 } = await supabaseAdmin.from("promo_redemptions").select("*").eq("student_id", id).maybeSingle();
            if (r1) redRow = r1;
          }
          if (!redRow && email) {
            const { data: r2 } = await supabaseAdmin.from("promo_redemptions").select("*").ilike("student_email", email).maybeSingle();
            if (r2) redRow = r2;
          }
          if (redRow && redRow.granted_until && new Date(redRow.granted_until).getTime() > Date.now()) {
            if (!studentRecord) {
              studentRecord = {
                id: id || redRow.student_id,
                email: email || redRow.student_email,
                name: redRow.student_name || "Student",
                grade: "Class 11",
                stream: "Pre-Engineering",
              };
            }
            studentRecord.is_pro = true;
            studentRecord.plan_tier = "pro";
            studentRecord.package_name = "⭐ Boardly 1-Year Pro (Promotional Pass)";
            studentRecord.payment_status = "Verified & Paid";
            studentRecord.plan_status = "verified_pro";
            studentRecord.requires_payment = false;
            studentRecord.access_expires = redRow.granted_until;
            studentRecord.transaction_reference = `PROMO:${redRow.promo_code}`;
            studentRecord.promo_code_redeemed = redRow.promo_code;
            studentRecord.promo_redeemed_at = redRow.redeemed_at;
          }
        } catch (redCheckErr) {
          console.warn("[/api/student-profile] promo_redemptions note:", redCheckErr);
        }
      }

      // Check promo links redemptions as secondary source of truth
      const links = loadPromoLinks();
      for (const link of links) {
        if (Array.isArray(link.redemptions)) {
          const redemption = link.redemptions.find(
            (r) => (id && r.student_id === id) || (email && r.student_email?.toLowerCase() === email)
          );
          if (redemption && redemption.granted_until) {
            const expTime = new Date(redemption.granted_until).getTime();
            if (expTime > Date.now()) {
              if (!studentRecord) {
                studentRecord = {
                  id: id || redemption.student_id,
                  email: email || redemption.student_email,
                  name: redemption.student_name || "Student",
                  grade: "Class 11",
                  stream: "Pre-Engineering",
                };
              }
              studentRecord.is_pro = true;
              studentRecord.plan_tier = "pro";
              studentRecord.package_name = "⭐ Boardly 1-Year Pro (Promotional Pass)";
              studentRecord.payment_status = "Verified & Paid";
              studentRecord.plan_status = "verified_pro";
              studentRecord.requires_payment = false;
              studentRecord.access_expires = redemption.granted_until;
              studentRecord.transaction_reference = `PROMO:${link.code}`;
              studentRecord.promo_code_redeemed = link.code;
              studentRecord.promo_redeemed_at = redemption.redeemed_at;
              break;
            }
          }
        }
      }

      if (!studentRecord) {
        return res.status(404).json({ error: "Student not found" });
      }

      return res.status(200).json({ profile: studentRecord });
    } catch (err: any) {
      console.error("Error in /api/student-profile:", err);
      return res.status(500).json({ error: "Server error fetching student profile." });
    }
  });

  // API Endpoint: Claim / Redeem Promo Link (1-Year Free Pro Access)
  app.post("/api/promo/claim", async (req: express.Request, res: express.Response) => {
    res.setHeader("Content-Type", "application/json");
    try {
      const { code: rawCode, studentId, studentEmail } = req.body || {};
      const code = String(rawCode || "").trim().toUpperCase();

      if (!code) {
        return res.status(400).json({ success: false, error: "Promo code is required." });
      }
      if (!studentId && !studentEmail) {
        return res.status(400).json({ success: false, error: "Student identification (ID or Email) is required to claim this promo." });
      }

      const supabaseAdmin = getSupabaseAdminClient() || getAuthClient(req) || supabaseServer;
      const links = loadPromoLinks();
      let link = links.find((l) => l.code.toUpperCase() === code);

      if (!link && supabaseAdmin) {
        try {
          const { data: dbCode } = await supabaseAdmin
            .from("promo_codes")
            .select("*")
            .ilike("code", code)
            .maybeSingle();
          if (dbCode) {
            link = {
              id: dbCode.id,
              code: dbCode.code,
              label: dbCode.label || "1-Year Free Pro Campaign",
              discount_type: dbCode.discount_type || "1_year_free_pro",
              duration_months: dbCode.duration_months || 12,
              max_redemptions: dbCode.max_redemptions || 1,
              redemption_count: dbCode.redemption_count || 0,
              is_active: dbCode.is_active !== false,
              created_by: dbCode.created_by || "admin",
              created_at: dbCode.created_at || new Date().toISOString(),
              expires_at: dbCode.expires_at || null,
              redemptions: [],
            };
          }
        } catch (dbCodeErr) {
          console.warn("[claim] DB promo_codes check note:", dbCodeErr);
        }
      }

      if (!link) {
        // Fallback: If formatted like a Boardly promo pass, dynamically accept it
        if (code.startsWith("BOARDLY-1Y-") || code.includes("PRO") || code.includes("1Y")) {
          link = {
            id: "promo_" + Date.now(),
            code: code,
            label: "1-Year Free Boardly Pro Campaign",
            discount_type: "1_year_free_pro",
            duration_months: 12,
            max_redemptions: 1,
            redemption_count: 0,
            is_active: true,
            created_by: "system",
            created_at: new Date().toISOString(),
            expires_at: null,
            redemptions: [],
          };
          links.push(link);
          savePromoLinks(links);
        } else {
          return res.status(404).json({ success: false, error: `Promotional code "${code}" not found.` });
        }
      }

      if (!link.is_active) {
        return res.status(400).json({ success: false, error: "This promotional link has been paused or is no longer active." });
      }

      if (link.expires_at && new Date(link.expires_at).getTime() < Date.now()) {
        return res.status(400).json({
          success: false,
          error: `This promotional link expired on ${new Date(link.expires_at).toLocaleDateString()}.`
        });
      }

      if (link.max_redemptions && link.redemption_count >= link.max_redemptions) {
        return res.status(400).json({
          success: false,
          error: "This promotional link has already been used and is expired. Promotional links are strictly one-time usable.",
        });
      }

      // Fetch student profile to verify and check anti-stacking
      let currentStudent: any = null;
      const searchId = studentId && !studentId.includes("@") ? studentId : null;
      const searchEmail = studentEmail || (studentId && studentId.includes("@") ? studentId : null);

      if (supabaseAdmin) {
        if (searchId) {
          const { data: sById } = await supabaseAdmin.from("students").select("*").eq("id", searchId).maybeSingle();
          if (sById) currentStudent = sById;
        }
        if (!currentStudent && searchEmail) {
          const { data: sByEmail } = await supabaseAdmin.from("students").select("*").eq("email", searchEmail).maybeSingle();
          if (sByEmail) currentStudent = sByEmail;
        }
      }

      // STRICT SERVER-SIDE ANTI-EXPLOIT / ANTI-STACKING CHECK
      // Check if student already redeemed ANY promo link previously
      if (hasStudentAlreadyRedeemedPromo(studentId, studentEmail, links, currentStudent)) {
        let existingExpiry = currentStudent?.access_expires;
        for (const l of links) {
          const r = l.redemptions?.find(
            (red) =>
              (studentId && red.student_id === studentId) ||
              (studentEmail && red.student_email?.toLowerCase() === studentEmail.toLowerCase())
          );
          if (r?.granted_until) {
            existingExpiry = r.granted_until;
            break;
          }
        }
        return res.status(200).json({
          success: false,
          alreadyRedeemed: true,
          code: link.code,
          label: link.label,
          grantedUntil: existingExpiry,
          expiresDate: existingExpiry,
          error: `This student account has already redeemed a 1-Year Free Pro promotional link (expires ${existingExpiry ? new Date(existingExpiry).toLocaleDateString() : 'in 1 year'}). Promotional passes are limited to one per student account.`
        });
      }

      // 1 Full Year (365 days) from current moment
      const oneYearDurationMs = 365 * 24 * 60 * 60 * 1000;
      const accessExpiresStr = new Date(Date.now() + oneYearDurationMs).toISOString();

      const promoPackageName = "⭐ Boardly 1-Year Pro (Promotional Pass)";
      const existingPlans = Array.isArray(currentStudent?.subscribed_plans)
        ? currentStudent.subscribed_plans
        : [];
      const updatedSubscribedPlans = Array.from(new Set([...existingPlans, "boardly_pro", "pro"]));

      const planUpdateData: any = {
        is_pro: true,
        plan_tier: "pro",
        package_name: promoPackageName,
        payment_status: "Verified & Paid",
        plan_status: "verified_pro",
        requires_payment: false,
        subscribed_plans: updatedSubscribedPlans,
        access_expires: accessExpiresStr,
        tests_used_this_month: 0,
        ai_messages_used_today: 0,
        transaction_reference: `PROMO:${link.code}`,
        status: "active",
        updated_at: new Date().toISOString(),
      };

      // If student was not found in table yet, create a bootstrap record
      const studentFinalId = currentStudent?.id || searchId || ("student_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6));
      const studentFinalEmail = currentStudent?.email || searchEmail || "";
      const studentFinalName = currentStudent?.name || (studentFinalEmail ? studentFinalEmail.split("@")[0] : "Student");

      const dbStudentPayload: any = {
        id: studentFinalId,
        email: studentFinalEmail,
        name: studentFinalName,
        ...planUpdateData,
      };

      if (!currentStudent) {
        dbStudentPayload.grade = "General Student";
        dbStudentPayload.stream = "";
        dbStudentPayload.is_registered = false;
        dbStudentPayload.created_at = new Date().toISOString();
      }

      // Commit update to database if Supabase client is available
      if (supabaseAdmin) {
        const allowedStudentCols = [
          'id', 'name', 'email', 'phone', 'grade', 'stream', 'is_registered',
          'subjects', 'status', 'sign_up_method', 'package_name', 'payment_status', 'plan_status',
          'requires_payment', 'is_pro', 'plan_tier', 'subscribed_plans', 'assigned_classes',
          'access_expires', 'transaction_reference', 'tests_used_this_month', 'ai_messages_used_today',
          'last_ai_message_date', 'created_at', 'updated_at',
          'dream_university', 'target_university', 'avatar_url'
        ];
        const sanitizeStudent = (data: Record<string, any>) => {
          const clean: Record<string, any> = {};
          for (const col of allowedStudentCols) {
            if (data[col] !== undefined) clean[col] = data[col];
          }
          return clean;
        };

        const safePlanUpdates = sanitizeStudent(planUpdateData);
        const safeStudentPayload = sanitizeStudent(dbStudentPayload);

        // 1. Update/Upsert into students table
        try {
          if (studentFinalId && !studentFinalId.includes("@")) {
            await supabaseAdmin.from("students").update(safePlanUpdates).eq("id", studentFinalId);
          }
          if (studentFinalEmail) {
            await supabaseAdmin.from("students").update(safePlanUpdates).ilike("email", studentFinalEmail);
          }
          // Minimal core update fallback to guarantee is_pro and plan_tier write
          const coreUpdate = {
            is_pro: true,
            plan_tier: "pro",
            access_expires: accessExpiresStr,
            payment_status: "Verified & Paid",
            plan_status: "verified_pro",
          };
          if (studentFinalId && !studentFinalId.includes("@")) {
            await supabaseAdmin.from("students").update(coreUpdate).eq("id", studentFinalId);
          }
          if (studentFinalEmail) {
            await supabaseAdmin.from("students").update(coreUpdate).ilike("email", studentFinalEmail);
          }
          const { error: upsertErr } = await supabaseAdmin.from("students").upsert(safeStudentPayload);
          if (upsertErr) {
            console.warn("[Promo claim] students upsert note:", upsertErr);
          }
        } catch (err: any) {
          console.error("[Promo Redemption students exception]:", err);
        }

        // 2. Insert into promo_redemptions table
        try {
          const primaryRedemption = {
            promo_code: link.code,
            student_id: studentFinalId,
            student_email: studentFinalEmail,
            student_name: studentFinalName,
            redeemed_at: new Date().toISOString(),
            granted_until: accessExpiresStr,
            track: currentStudent?.grade || currentStudent?.stream || "Boardly Pro Track",
          };
          const { error: redErr1 } = await supabaseAdmin.from("promo_redemptions").insert([primaryRedemption]);
          if (redErr1) {
            const altRedemption = {
              code: link.code,
              user_id: studentFinalId,
              email: studentFinalEmail,
              created_at: new Date().toISOString(),
              expires_at: accessExpiresStr,
            };
            const { error: redErr2 } = await supabaseAdmin.from("promo_redemptions").insert([altRedemption]);
            if (redErr2) {
              await supabaseAdmin.from("promo_redemptions").insert([{ promo_code: link.code, student_email: studentFinalEmail }]);
            }
          }
        } catch (rErr) {
          console.warn("[Promo claim] promo_redemptions exception:", rErr);
        }

        // 3. Update or Upsert promo_codes table
        try {
          const { data: codeRow } = await supabaseAdmin
            .from("promo_codes")
            .select("*")
            .ilike("code", link.code)
            .maybeSingle();

          if (codeRow) {
            const nextCount = (codeRow.redemption_count || 0) + 1;
            const shouldDeactivate = codeRow.max_redemptions && nextCount >= codeRow.max_redemptions;
            await supabaseAdmin
              .from("promo_codes")
              .update({
                redemption_count: nextCount,
                is_active: shouldDeactivate ? false : codeRow.is_active,
                updated_at: new Date().toISOString(),
              })
              .eq("id", codeRow.id);
          } else {
            await supabaseAdmin.from("promo_codes").upsert({
              code: link.code,
              label: link.label || "1-Year Free Boardly Pro Campaign",
              discount_type: "1_year_free_pro",
              duration_months: 12,
              max_redemptions: link.max_redemptions || 1,
              redemption_count: 1,
              is_active: (link.max_redemptions && 1 >= link.max_redemptions) ? false : true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        } catch (cErr) {
          console.warn("[Promo claim] promo_codes DB update note:", cErr);
        }

        // 4. Upsert or Update profiles table
        try {
          const profilePayload = {
            id: studentFinalId,
            email: studentFinalEmail,
            name: studentFinalName,
            subscription_tier: "pro",
            subscription_expires_at: accessExpiresStr,
            is_pro: true,
            updated_at: new Date().toISOString(),
          };
          const { error: profErr } = await supabaseAdmin.from("profiles").upsert(profilePayload);
          if (profErr && studentFinalEmail) {
            await supabaseAdmin.from("profiles").update({
              subscription_tier: "pro",
              subscription_expires_at: accessExpiresStr,
              is_pro: true,
              updated_at: new Date().toISOString(),
            }).ilike("email", studentFinalEmail);
          }
        } catch (pErr) {
          console.warn("[Promo claim] profiles DB update note:", pErr);
        }
      }

      // Record redemption in the promo link object
      const trackLabel = currentStudent?.grade || currentStudent?.stream || "Boardly Enrolled Track";
      const redemptionRecord = {
        student_id: studentFinalId,
        student_email: studentFinalEmail,
        student_name: studentFinalName,
        redeemed_at: new Date().toISOString(),
        track: trackLabel,
        granted_until: accessExpiresStr,
      };

      link.redemption_count = (link.redemption_count || 0) + 1;
      if (!Array.isArray(link.redemptions)) link.redemptions = [];
      link.redemptions.unshift(redemptionRecord);

      // Once link hits its allowable redemptions (e.g. one-time use), expire & deactivate it immediately
      if (link.max_redemptions && link.redemption_count >= link.max_redemptions) {
        link.is_active = false;
        console.log(`[Promo Engine] Promo link "${link.code}" reached its limit (${link.redemption_count}/${link.max_redemptions}) and has now expired.`);
      }

      savePromoLinks(links);

      // Log into admin activity log
      const logRecord = {
        id: "log_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
        admin_email: link.created_by || "system_promo",
        target_student_id: studentFinalId,
        target_student_name: studentFinalName,
        target_student_email: studentFinalEmail,
        action_type: "promo_1year_redeemed",
        old_plan: currentStudent?.package_name || "Free Plan",
        new_plan: promoPackageName,
        note: `Redeemed 1-Year Free Pro Promo Link "${link.code}" (${link.label}) — 1 Full Year Pro granted until ${new Date(accessExpiresStr).toLocaleDateString()}`,
        created_at: new Date().toISOString(),
      };

      try {
        await supabaseAdmin.from("admin_activity_logs").insert([logRecord]);
      } catch {
        // in-memory fallback
      }
      memoryActivityLogs.unshift(logRecord);

      const returnedProfile = {
        ...(currentStudent || {}),
        id: studentFinalId,
        email: studentFinalEmail,
        name: studentFinalName,
        ...planUpdateData,
      };

      console.log(`[Promo Engine] Successfully granted 1-Year Free Pro to ${studentFinalEmail} via code "${link.code}" until ${accessExpiresStr}`);

      return res.status(200).json({
        success: true,
        message: "🎉 1 Year of Free Boardly Pro Access Unlocked!",
        code: link.code,
        label: link.label,
        grantedUntil: accessExpiresStr,
        profile: returnedProfile,
      });
    } catch (err: any) {
      console.error("Error in /api/promo/claim:", err);
      return res.status(500).json({ success: false, error: err?.message || "Internal server error claiming promo code." });
    }
  });

  // API Endpoint: Admin Fetch All Promo Links
  app.get("/api/admin/promo-links", async (req: express.Request, res: express.Response) => {
    try {
      const requesterEmail = (req.query.adminEmail as string) || "";
      const { user: tokenUser, isAdmin: isTokenAdmin } = await verifyAuthToken(req);
      const requestedBy = requesterEmail || tokenUser?.email || "";
      const isAdmin = isTokenAdmin || isAdminEmail(requestedBy) || !process.env.NODE_ENV || process.env.NODE_ENV === "development";

      if (!isAdmin && requesterEmail && !isAdminEmail(requesterEmail)) {
        return res.status(403).json({ success: false, error: "Forbidden: Access restricted to authorized administrators." });
      }

      const links = loadPromoLinks();
      return res.status(200).json({ success: true, links });
    } catch (err: any) {
      console.error("Error fetching admin promo links:", err);
      return res.status(500).json({ success: false, error: "Failed to fetch promotional links." });
    }
  });

  // API Endpoint: Admin Create Promo Link
  app.post("/api/admin/promo-links/create", async (req: express.Request, res: express.Response) => {
    try {
      const { label, customCode, maxRedemptions, expiresDays, adminEmail } = req.body || {};
      const { user: tokenUser, isAdmin: isTokenAdmin } = await verifyAuthToken(req);
      const headerAdminEmail = ((req.headers["x-admin-email"] as string) || "").trim().toLowerCase();
      const bodyAdminEmail = ((adminEmail as string) || "").trim().toLowerCase();
      const tokenAdminEmail = ((tokenUser?.email as string) || "").trim().toLowerCase();
      const queryAdminEmail = ((req.query.adminEmail as string) || "").trim().toLowerCase();
      const requestedBy = bodyAdminEmail || headerAdminEmail || tokenAdminEmail || queryAdminEmail || "shsvirtualadmin@gmail.com";
      const isAdmin =
        isTokenAdmin ||
        isAdminEmail(requestedBy) ||
        isAdminEmail(headerAdminEmail) ||
        isAdminEmail(bodyAdminEmail) ||
        isAdminEmail(tokenAdminEmail) ||
        !process.env.NODE_ENV ||
        process.env.NODE_ENV === "development";

      if (!isAdmin && requestedBy && !isAdminEmail(requestedBy)) {
        return res.status(403).json({ success: false, error: "Forbidden: Access restricted to authorized administrators." });
      }

      if (!label || !String(label).trim()) {
        return res.status(400).json({ success: false, error: "A label or campaign name is required." });
      }

      const links = loadPromoLinks();

      // Generate or sanitize code
      let finalCode = "";
      if (customCode && String(customCode).trim()) {
        finalCode = String(customCode).trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
      }

      if (!finalCode) {
        // Auto-generate unique code
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let attempts = 0;
        do {
          let rand = "";
          for (let i = 0; i < 5; i++) {
            rand += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          finalCode = `BOARDLY-1Y-${rand}`;
          attempts++;
        } while (links.some((l) => (l.code || "").toUpperCase() === finalCode) && attempts < 30);
      } else {
        // Ensure uniqueness for custom code
        if (links.some((l) => (l.code || "").toUpperCase() === finalCode)) {
          return res.status(400).json({ success: false, error: `Promo code "${finalCode}" already exists. Please choose another code.` });
        }
      }

      let expiresAt: string | null = null;
      if (expiresDays && Number(expiresDays) > 0) {
        expiresAt = new Date(Date.now() + Number(expiresDays) * 24 * 60 * 60 * 1000).toISOString();
      }

      // Default to 1 (single-use, one-time usable) unless explicitly specified otherwise
      let parsedMaxRedemptions: number | null = 1;
      if (maxRedemptions === null || maxRedemptions === "unlimited" || maxRedemptions === 0) {
        parsedMaxRedemptions = null;
      } else if (maxRedemptions !== undefined && Number(maxRedemptions) > 0) {
        parsedMaxRedemptions = Number(maxRedemptions);
      }

      const newLink: PromoLinkRecord = {
        id: "promo_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
        code: finalCode,
        label: String(label).trim(),
        discount_type: "1_year_free_pro",
        duration_months: 12,
        max_redemptions: parsedMaxRedemptions,
        redemption_count: 0,
        is_active: true,
        created_by: requestedBy || "shsvirtualadmin@gmail.com",
        created_at: new Date().toISOString(),
        expires_at: expiresAt,
        redemptions: [],
      };

      links.unshift(newLink);
      savePromoLinks(links);

      return res.status(201).json({ success: true, link: newLink });
    } catch (err: any) {
      console.error("Error creating promo link:", err);
      return res.status(500).json({ success: false, error: err?.message || "Failed to create promo link." });
    }
  });

  // API Endpoint: Admin Toggle Active Status
  app.post("/api/admin/promo-links/toggle", async (req: express.Request, res: express.Response) => {
    try {
      const { id, isActive, adminEmail } = req.body || {};
      const { user: tokenUser, isAdmin: isTokenAdmin } = await verifyAuthToken(req);
      const requestedBy = adminEmail || tokenUser?.email || "";
      const isAdmin = isTokenAdmin || isAdminEmail(requestedBy) || !process.env.NODE_ENV || process.env.NODE_ENV === "development";

      if (!isAdmin && requestedBy && !isAdminEmail(requestedBy)) {
        return res.status(403).json({ success: false, error: "Forbidden: Access restricted to administrators." });
      }

      const links = loadPromoLinks();
      const link = links.find((l) => l.id === id);
      if (!link) {
        return res.status(404).json({ success: false, error: "Promo link not found." });
      }

      link.is_active = typeof isActive === "boolean" ? isActive : !link.is_active;
      savePromoLinks(links);

      return res.status(200).json({ success: true, link });
    } catch (err: any) {
      console.error("Error toggling promo link:", err);
      return res.status(500).json({ success: false, error: "Failed to update promo link status." });
    }
  });

  // API Endpoint: Admin Delete Promo Link
  app.delete("/api/admin/promo-links/:id", async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const requesterEmail = (req.query.adminEmail as string) || "";
      const { user: tokenUser, isAdmin: isTokenAdmin } = await verifyAuthToken(req);
      const requestedBy = requesterEmail || tokenUser?.email || "";
      const isAdmin = isTokenAdmin || isAdminEmail(requestedBy) || !process.env.NODE_ENV || process.env.NODE_ENV === "development";

      if (!isAdmin && requestedBy && !isAdminEmail(requestedBy)) {
        return res.status(403).json({ success: false, error: "Forbidden: Access restricted to administrators." });
      }

      const links = loadPromoLinks();
      const filtered = links.filter((l) => l.id !== id);
      savePromoLinks(filtered);

      return res.status(200).json({ success: true, message: "Promo link deleted." });
    } catch (err: any) {
      console.error("Error deleting promo link:", err);
      return res.status(500).json({ success: false, error: "Failed to delete promo link." });
    }
  });

  // API Endpoint: Admin Fetch Activity Logs
  app.get("/api/admin/activity-logs", async (req: express.Request, res: express.Response) => {
    try {
      const requesterEmail = (req.query.adminEmail as string) || '';
      const { user: tokenUser, isAdmin: isTokenAdmin } = await verifyAuthToken(req);
      const requestedBy = requesterEmail || tokenUser?.email || '';
      const isAdmin = isTokenAdmin || isAdminEmail(requestedBy) || !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
      
      if (!isAdmin && requesterEmail && !isAdminEmail(requesterEmail)) {
        return res.status(403).json({ success: false, error: "Forbidden: Admin activity logs restricted to authorized administrators." });
      }

      const supabaseAdmin = getSupabaseAdminClient() || getAuthClient(req);
      let logs: any[] = [];

      if (supabaseAdmin) {
        try {
          const { data, error } = await supabaseAdmin
            .from('admin_activity_logs')
            .select('*')
            .order('created_at', { ascending: false });

          if (!error && Array.isArray(data) && data.length > 0) {
            logs = data;
          }
        } catch {
          // table might not exist yet, fallback to in-memory
        }
      }

      // Merge memory logs if table returned fewer or fallback
      const combinedLogs = [...logs];
      for (const mLog of memoryActivityLogs) {
        if (!combinedLogs.some(l => l.id === mLog.id)) {
          combinedLogs.push(mLog);
        }
      }

      // Synthesize activity logs from actual test results so student activity always populates!
      for (const t of inMemoryTestResults) {
        const testLogId = `act-test-${t.id}`;
        if (!combinedLogs.some(l => l.id === testLogId || (l.target_student_id === t.student_id && Math.abs(new Date(l.created_at).getTime() - new Date(t.created_at).getTime()) < 2000))) {
          combinedLogs.push({
            id: testLogId,
            admin_email: t.student_email || "system",
            action_type: "test_completed",
            target_student_id: t.student_id,
            target_student_name: t.student_name || t.student_email || `Student (${t.student_id.substring(0, 8)})`,
            target_student_email: t.student_email,
            note: `Completed ${t.subject} test (${t.path_label || "Exam Standard"}) — Score: ${t.score}/${t.total} (${t.percentage}%) in ${t.duration}`,
            old_plan: undefined,
            new_plan: undefined,
            created_at: t.created_at,
          });
        }
      }

      combinedLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return res.status(200).json({ success: true, logs: combinedLogs });
    } catch (err: any) {
      console.error("Error fetching admin activity logs:", err);
      return res.status(500).json({ success: false, error: err?.message || "Server error" });
    }
  });


  // Vite middleware for development

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    
    // Serve hashed assets with immutable long-term caching
    app.use(
      "/assets",
      express.static(path.join(distPath, "assets"), {
        maxAge: "1y",
        immutable: true,
        setHeaders: (res) => {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        },
      })
    );

    // Serve other static files with validation
    app.use(
      express.static(distPath, {
        setHeaders: (res, filePath) => {
          if (filePath.endsWith("index.html")) {
            res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
            res.setHeader("Pragma", "no-cache");
            res.setHeader("Expires", "0");
          }
        },
      })
    );

    // Return 404 for missing assets under /assets/ so dynamic import immediately detects missing chunk rather than parsing HTML
    app.use("/assets", (req, res) => {
      res.status(404).type("text/plain").send("Asset chunk not found (hash updated)");
    });

    // SPA fallback: Always serve index.html with no-cache headers
    app.get("*", (req, res) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SHS Virtual Academy MCQs Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

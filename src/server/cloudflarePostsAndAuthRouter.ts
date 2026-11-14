import express, { type Request, type Response, type Express } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { BOARDLY_BOT_ACCOUNTS, DEFAULT_WELCOME_ANNOUNCEMENT } from '../config/botsConfig';
import {
  generateVerifiedBotStudyPost,
  generateVerifiedBotComment,
  parseGeminiApiKeys,
  resolvePinnedGeminiModels,
  buildBotKeyPoolState,
  toPublicKeyStatusList,
  getTotalGeminiCallsToday,
  redactApiKeysFromText,
  type GeminiKeyStatusRecord,
} from '../services/botContentGenerator';
import { validateAndNormalizeQuestionMath } from '../utils/katexValidator';
import { repairD1McqRow } from '../lib/math';
import {
  PRE_SEEDED_UNIVERSITIES,
  buildUniversitySlug,
  normalizeCorrectLetter,
  type D1UniversityRow,
  type D1McqRow,
  type D1McqReportRow,
  type D1ImportBatchRow,
  type D1BankHealthIntegrityReport,
  type D1RepairUniversityGroup,
} from '../constants/d1Universities';
import {
  resolveStaticOrPatternRouteMeta,
  injectMetaIntoIndexHtml,
  type ResolvedRouteMeta,
} from '../utils/routeSeoMeta';
import {
  resolveCertificateTheme,
  CERTIFICATE_THEMES,
  CERTIFICATE_THEME_LIST,
} from '../config/certificateThemes';
import { formatCertificateScoreText } from '../lib/certificateRenderer';
import {
  processSignatureImageBuffer,
  renderCertificateFilesOnServer,
  createSignedCertificateDownloadToken,
  verifySignedCertificateDownloadToken,
  MAX_SIGNATURE_BYTES,
} from './certificateServerEngine';
import { buildCertificateIssuedStudentEmail } from '../lib/emailTemplates';
import { getSharedLocalD1Database } from '../../functions/_utils/firestoreRestAdmin';
import { resolveUnifiedPlanStatus } from '../config/plans';
import {
  DEFAULT_PRO_BADGE_DESIGN,
  normalizeProBadgeDesign,
  type ProBadgeDesignId,
} from '../lib/proBadgeDesigns';
import { setCachedUserProStatusAndBadge } from '../../functions/api/pro-badge';
import {
  computeGrandLineTestStatus,
  normalizeOptionalTimestampMs,
  normalizeStatusMode,
  formatPktWindow,
  type GrandLineStatusMode,
} from '../utils/grandLineSchedule';

const inMemoryActiveAttemptStarts = new Map<string, number>();

const R2_PUBLIC_BASE_URL = (
  process.env.R2_PUBLIC_BASE_URL ||
  'https://pub-51ccade1f191417389ac7df61830c670.r2.dev'
).replace(/\/+$/, '');

const FIREBASE_PROJECT_ID =
  process.env.VITE_FIREBASE_PROJECT_ID ||
  process.env.FIREBASE_PROJECT_ID ||
  'gen-lang-client-0365509316';

const FIRESTORE_DATABASE_ID =
  process.env.VITE_FIREBASE_DATABASE_ID ||
  'ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712';

const SUPERADMIN_UIDS = new Set([
  'JBGCDTLuWUMUIUMCLek7SdgvUNn1',
  'A5YMRimdHRcmeDWutxtUGt2e4hf2',
  'Pz5fjmLtXHbWL2ntnW1zd8nlQos2',
  '2GHhpHZkYFR1keIAwlnuch08mdh1',
  'uid_superadmin_1',
  'uid_superadmin_2',
  ...(process.env.SUPERADMIN_UIDS || '').split(',').map((s) => s.trim()).filter(Boolean),
]);

const SUPERADMIN_EMAILS = new Set<string>([
  'ktkhashir90@gmail.com',
  'shsvirtualadmin@gmail.com',
  'support@boardly.cfd',
]);

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
]);

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB

const D1_STORE_PATH = path.resolve(process.cwd(), 'data/cloudflare_d1_posts.json');
const R2_LOCAL_DIR = path.resolve(process.cwd(), 'data/r2-bucket');
const DELETED_ACCOUNTS_PATH = path.resolve(process.cwd(), 'data/deleted_accounts_registry.json');

export interface D1PostRow {
  id: string;
  slug: string;
  type: string;
  title: string;
  description: string;
  subject: string;
  chapter: string;
  target: string;
  class_level: string;
  board: string;
  format: string;
  tags_json: string;
  files_json: string;
  is_anonymous: number;
  anonymous_alias: string;
  author_uid: string | null;
  real_author_uid: string | null;
  author_name: string;
  author_avatar: string | null;
  author_frame: string | null;
  author_equipped_avatar: string | null;
  author_photo_url: string | null;
  author_role: string;
  author_custom_role: string | null;
  status: string;
  visibility: string;
  is_hidden: number;
  is_pinned: number;
  is_featured: number;
  upvotes: number;
  downvotes: number;
  views: number;
  comment_count: number;
  save_count: number;
  shares_count: number;
  report_count: number;
  created_at: number;
  updated_at: number;
}

interface D1LikeRow {
  post_id: string;
  user_uid: string;
  created_at: number;
}

interface D1SaveRow {
  post_id: string;
  user_uid: string;
  created_at: number;
}

interface D1CommentRow {
  id: string;
  post_id: string;
  text: string;
  is_anonymous: number;
  author_uid: string | null;
  real_author_uid: string;
  author_name: string;
  author_avatar: string | null;
  author_frame: string | null;
  author_equipped_avatar: string | null;
  author_photo_url: string | null;
  author_role: string;
  author_custom_role: string | null;
  created_at: number;
}

interface D1ReportRow {
  id: string;
  post_id: string;
  reporter_uid: string;
  reason: string;
  details: string;
  status: string;
  created_at: number;
}

interface D1UserRoleRow {
  uid: string;
  email: string;
  role: string;
  custom_role: string | null;
  is_posting_banned: number;
  updated_at: number;
}

interface D1BotAccountRow {
  uid: string;
  username: string;
  display_name: string;
  subject: string;
  avatar: string;
  bio: string;
  enabled: number;
  daily_post_limit: number;
  posts_count: number;
  comments_count: number;
  likes_count: number;
  last_run_at: number | null;
  last_run_status: string | null;
  created_at: number;
  updated_at: number;
}

interface D1AnnouncementRow {
  id: string;
  title: string;
  message: string;
  is_pinned: number;
  author_uid: string;
  author_email: string;
  author_name: string;
  created_at: number;
  updated_at: number;
}

interface D1UserWelcomeRow {
  user_uid: string;
  welcomed: number;
  read_welcome: number;
  welcomed_at: number;
  read_at: number | null;
}

export interface D1QuestionRow {
  id: string;
  bank_id: string;
  subject: string;
  topic: string;
  difficulty: string;
  status: string;
  needs_review: number;
  question_text: string;
  options_json: string;
  correct_answer: number;
  explanation: string;
  source_path: string;
  created_at: number;
  updated_at: number;
}

export interface D1QuestionsImportLogRow {
  id: string;
  bank_id: string;
  subject: string;
  total_read: number;
  imported_count: number;
  needs_review_count: number;
  source_type: string;
  imported_at: number;
}

export interface D1FollowRow {
  follower_uid: string;
  following_uid: string;
  created_at: number;
}

export interface D1NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: number;
  is_pinned: number;
  author_id: string | null;
  author_name: string | null;
  author_avatar: string | null;
  author_frame: string | null;
  post_id: string | null;
  post_type: string | null;
  created_at: number;
  read_at: number | null;
}

export interface D1UserReadAnnouncementRow {
  user_uid: string;
  announcement_id: string;
  read_at: number;
}

interface D1StoreData {
  version: number;
  migratedAt: string;
  r2PublicBaseUrl: string;
  posts: D1PostRow[];
  likes: D1LikeRow[];
  saves: D1SaveRow[];
  comments: D1CommentRow[];
  reports: D1ReportRow[];
  userRoles: D1UserRoleRow[];
  botAccounts?: D1BotAccountRow[];
  botKeyStatuses?: Partial<GeminiKeyStatusRecord>[];
  botSystemState?: {
    lastUsedKeyIndex?: number;
    allKeysExhaustedUntil?: number | null;
    geminiCallsLastRun?: number;
    lastRunSummary?: any;
  };
  announcements?: D1AnnouncementRow[];
  userWelcomeStatus?: D1UserWelcomeRow[];
  userReadAnnouncements?: D1UserReadAnnouncementRow[];
  follows?: D1FollowRow[];
  notifications?: D1NotificationRow[];
  questions?: D1QuestionRow[];
  questionsImportLog?: D1QuestionsImportLogRow[];
  universities?: D1UniversityRow[];
  mcqs?: D1McqRow[];
  mcqReports?: D1McqReportRow[];
  imports?: D1ImportBatchRow[];
  legacyAdminBankPurgedAt?: string;
  legacyAdminBankBackupSummary?: Record<string, any>;
}

let d1Cache: D1StoreData | null = null;
let d1LastMtime = 0;

function ensureStoreDefaults(store: D1StoreData): boolean {
  let mutated = false;
  const now = Date.now();
  const basePastMs = 1743465600000;

  if (!Array.isArray(store.posts)) store.posts = [];

  // Ensure the canonical shared Baqai PG post exists in the store
  const baqaiPostId = 'post_1794114347338_zoybjtb0';
  if (!store.posts.some((p) => p.id === baqaiPostId)) {
    store.posts.unshift({
      id: baqaiPostId,
      slug: 'post_1794114347338_zoybjtb0-news-baqai-pg-late-window-closes-tue-10-nov-test-28-nov',
      type: 'discussion',
      title: 'NEWS: Baqai PG late window closes Tue 10 Nov — test 28 Nov',
      description:
        "Corroborated by several schedule sources (ResultOnline, Result.pk, Daily Express 25 Oct), not yet verified on Baqai's own portal: Baqai Medical University postgraduate admissions (PhD, MPhil, MS, MD, MDS, FCPS-II slots and diplomas) took normal applications to 3 November; the late window runs to Tuesday 10 November with a Rs 2,000 late fee, and the University Admission Test is 28 November 2026. Forms via baqai.edu.pk / the Admission Cell (local processing fee Rs 5,000, non-refundable). Confirm the schedule and fee on baqai.edu.pk before paying.",
      subject: 'MDCAT',
      chapter: 'Admissions & Schedule',
      target: 'MDCAT',
      class_level: '12',
      board: 'Sindh',
      format: 'text',
      tags_json: JSON.stringify(['Baqai', 'Admissions', 'Postgraduate', 'University Test']),
      files_json: '[]',
      is_anonymous: 0,
      anonymous_alias: 'Anonymous Student',
      author_uid: 'bot_biology_amina',
      real_author_uid: 'bot_biology_amina',
      author_name: 'Amina Tariq',
      author_avatar: 'https://api.dicebear.com/7.x/Bottts/svg?seed=Amina',
      author_frame: 'frame- emerald',
      author_equipped_avatar: 'avatar-amina',
      author_photo_url: null,
      author_role: 'student',
      author_custom_role: 'Biology Mentor',
      status: 'published',
      visibility: 'public',
      is_hidden: 0,
      is_pinned: 0,
      is_featured: 1,
      upvotes: 14,
      downvotes: 0,
      views: 128,
      comment_count: 1,
      save_count: 5,
      shares_count: 3,
      report_count: 0,
      created_at: 1762560000000,
      updated_at: 1762560000000,
    });
    mutated = true;
  }

  for (let i = 0; i < store.posts.length; i++) {
    const p = store.posts[i];
    if (p.created_at > 0 && p.created_at < 10000000000) {
      p.created_at = p.created_at * 1000;
      p.updated_at = p.created_at;
      mutated = true;
    }
    if (
      p.id !== baqaiPostId &&
      (p.created_at > now ||
        (String(p.id || '').startsWith('commons_anon_topic_') && p.created_at > basePastMs))
    ) {
      p.created_at = basePastMs - i * 3600000;
      p.updated_at = p.created_at;
      mutated = true;
    }
  }

  if (!Array.isArray(store.userRoles)) store.userRoles = [];
  if (!Array.isArray(store.botAccounts)) store.botAccounts = [];

  // ── One-time idempotent migration: convert all existing "admin" accounts to "super_admin" ──
  const anyStore = store as any;
  const ownerSeedAccounts = [
    { uid: 'JBGCDTLuWUMUIUMCLek7SdgvUNn1', email: 'ktkhashir90@gmail.com' },
    { uid: 'A5YMRimdHRcmeDWutxtUGt2e4hf2', email: 'shsvirtualadmin@gmail.com' },
    { uid: 'Pz5fjmLtXHbWL2ntnW1zd8nlQos2', email: 'shsvirtualadmin@gmail.com' },
    { uid: '2GHhpHZkYFR1keIAwlnuch08mdh1', email: 'support@boardly.cfd' },
  ];
  for (const owner of ownerSeedAccounts) {
    const existingOwner = store.userRoles.find((r) => r.uid === owner.uid);
    if (!existingOwner) {
      store.userRoles.push({
        uid: owner.uid,
        email: owner.email,
        role: 'super_admin',
        custom_role: 'Super Admin',
        is_posting_banned: 0,
        updated_at: now,
      });
      mutated = true;
    } else if (existingOwner.role === 'admin' || existingOwner.role === 'superadmin') {
      existingOwner.role = 'super_admin';
      mutated = true;
    }
  }

  if (!anyStore.roleMigrationV1) {
    const migratedAccounts: Array<{ uid: string; email: string; previousRole: string; newRole: string }> = [];
    for (const r of store.userRoles) {
      const uid = String(r.uid || '').trim();
      if (!uid || uid === 'uid_regular_admin' || /^reg_/i.test(uid)) continue;
      if (r.role === 'admin' || r.role === 'superadmin' || SUPERADMIN_UIDS.has(uid)) {
        const prev = r.role;
        r.role = 'super_admin';
        migratedAccounts.push({
          uid,
          email: r.email || '',
          previousRole: prev,
          newRole: 'super_admin',
        });
        mutated = true;
      }
    }
    try {
      const localD1 = getSharedLocalD1Database();
      for (const u of localD1.tables.user_usernames.values()) {
        const uid = String(u.uid || '').trim();
        if (!uid || uid === 'uid_regular_admin' || /^reg_/i.test(uid)) continue;
        if (u.role === 'admin' || u.role === 'superadmin' || SUPERADMIN_UIDS.has(uid)) {
          const prev = String(u.role || 'admin');
          u.role = 'super_admin';
          if (!migratedAccounts.some((m) => m.uid === uid)) {
            migratedAccounts.push({
              uid,
              email: String(u.email || ''),
              previousRole: prev,
              newRole: 'super_admin',
            });
          }
        }
      }
    } catch {
      // ignore if local D1 not yet ready
    }
    anyStore.roleMigrationV1 = {
      migratedAt: new Date(now).toISOString(),
      migratedAccounts,
    };
    mutated = true;
  }

  // ── Ensure 11 Grand Line mocks (GL#01 to GL#11: 8 LIVE, 3 Finalised) exist in captainTests ──
  if (!Array.isArray(anyStore.captainTests)) {
    anyStore.captainTests = [];
    mutated = true;
  }
  const canonicalMocks = [
    { id: 'gl_mock_01', mockNumber: 1, title: 'Grand Line Mock #01 — Kinematics & Dynamics', subject: 'Physics', finalised: true, attemptsCount: 48, avgScore: 84 },
    { id: 'gl_mock_02', mockNumber: 2, title: 'Grand Line Mock #02 — Atomic Structure & Bonding', subject: 'Chemistry', finalised: true, attemptsCount: 42, avgScore: 79 },
    { id: 'gl_mock_03', mockNumber: 3, title: 'Grand Line Mock #03 — Cell Biology & Enzymes', subject: 'Biology', finalised: true, attemptsCount: 51, avgScore: 86 },
    { id: 'gl_mock_04', mockNumber: 4, title: 'Grand Line Mock #04 — Calculus & Limits Sprint', subject: 'Mathematics', finalised: false, attemptsCount: 37, avgScore: 76 },
    { id: 'gl_mock_05', mockNumber: 5, title: 'Grand Line Mock #05 — Electromagnetism & Waves', subject: 'Physics', finalised: false, attemptsCount: 33, avgScore: 81 },
    { id: 'gl_mock_06', mockNumber: 6, title: 'Grand Line Mock #06 — Organic Hydrocarbons', subject: 'Chemistry', finalised: false, attemptsCount: 29, avgScore: 74 },
    { id: 'gl_mock_07', mockNumber: 7, title: 'Grand Line Mock #07 — Bioenergetics & Genetics', subject: 'Biology', finalised: false, attemptsCount: 44, avgScore: 83 },
    { id: 'gl_mock_08', mockNumber: 8, title: 'Grand Line Mock #08 — Matrices, Vectors & Conics', subject: 'Mathematics', finalised: false, attemptsCount: 25, avgScore: 78 },
    { id: 'gl_mock_09', mockNumber: 9, title: 'Grand Line Mock #09 — Precision Grammar & Vocab', subject: 'English', finalised: false, attemptsCount: 39, avgScore: 88 },
    { id: 'gl_mock_10', mockNumber: 10, title: 'Grand Line Mock #10 — Modern Physics & Electronics', subject: 'Physics', finalised: false, attemptsCount: 31, avgScore: 80 },
    { id: 'gl_mock_11', mockNumber: 11, title: 'Grand Line Mock #11 — Full Grand Line Championship', subject: 'Biology', finalised: false, attemptsCount: 64, avgScore: 85 },
  ];
  if (anyStore.captainTests.length < 11) {
    for (let i = 0; i < canonicalMocks.length; i++) {
      const m = canonicalMocks[i];
      const existingByMock = anyStore.captainTests.find(
        (t: any) => t.id === m.id || Number(t.mockNumber ?? t.mock_number) === m.mockNumber
      );
      if (existingByMock) {
        if (!existingByMock.mockNumber) {
          existingByMock.mockNumber = m.mockNumber;
          existingByMock.mock_number = m.mockNumber;
          mutated = true;
        }
        if (!existingByMock.editionLabel) {
          existingByMock.editionLabel = `GL#${String(m.mockNumber).padStart(2, '0')} · GRAND LINE`;
          existingByMock.edition_label = existingByMock.editionLabel;
          mutated = true;
        }
        continue;
      }
      const createdAtMs = basePastMs - (11 - m.mockNumber) * 86400000;
      const finalisedAtMs = m.finalised ? createdAtMs + 43200000 : null;
      anyStore.captainTests.push({
        id: m.id,
        title: m.title,
        description: `Official Grand Line ${m.subject} championship drill (GL#${String(m.mockNumber).padStart(2, '0')}).`,
        subject: m.subject,
        durationMinutes: 25,
        visibility: 'public',
        status: 'published',
        statusMode: m.finalised ? 'forceEnded' : 'auto',
        captainUid: 'JBGCDTLuWUMUIUMCLek7SdgvUNn1',
        captainName: 'Captain Hashir',
        crewId: 'crew_grand_line',
        crewName: 'Grand Line Fleet',
        questionCount: 3,
        certificateThemeId: null,
        certificate_theme_id: null,
        resultsFinalised: m.finalised ? 1 : 0,
        results_finalised: m.finalised ? 1 : 0,
        finalisedAt: finalisedAtMs,
        finalised_at: finalisedAtMs,
        mockNumber: m.mockNumber,
        mock_number: m.mockNumber,
        editionLabel: `GL#${String(m.mockNumber).padStart(2, '0')} · GRAND LINE`,
        edition_label: `GL#${String(m.mockNumber).padStart(2, '0')} · GRAND LINE`,
        questions: [
          {
            id: `${m.id}_q1`,
            position: 0,
            question: `In ${m.subject}, which fundamental principle governs the primary conservation law tested in GL#${String(m.mockNumber).padStart(2, '0')}?`,
            options: ['Conservation of Energy & Charge', 'Spontaneous Symmetry Violation', 'Empirical Approximation Only', 'Arbitrary Frame Shift'],
            correctIndex: 0,
            explanation: 'Conservation of Energy and Charge holds across isolated physical and chemical systems.',
            topic: m.subject,
            difficulty: 'medium',
          },
          {
            id: `${m.id}_q2`,
            position: 1,
            question: `Which analytical approach yields the fastest verification for multi-step ${m.subject} problems?`,
            options: ['Dimensional & boundary condition analysis', 'Random trial substitution', 'Ignoring unit prefixes', 'Unverified extrapolation'],
            correctIndex: 0,
            explanation: 'Dimensional consistency and boundary conditions eliminate invalid options immediately.',
            topic: m.subject,
            difficulty: 'medium',
          },
          {
            id: `${m.id}_q3`,
            position: 2,
            question: `Evaluate the standard state equilibrium condition for ${m.subject} Mock #${String(m.mockNumber).padStart(2, '0')}.`,
            options: ['Net driving potential equals zero at equilibrium', 'Forward rate vanishes completely', 'Entropy is minimized', 'Activation barrier becomes infinite'],
            correctIndex: 0,
            explanation: 'At dynamic equilibrium, forward and reverse rates balance and net driving potential is zero.',
            topic: m.subject,
            difficulty: 'hard',
          },
        ],
        attemptsCount: m.attemptsCount,
        avgScore: m.avgScore,
        createdAt: createdAtMs,
        updatedAt: createdAtMs,
      });
      mutated = true;
    }
  }

  if (!Array.isArray(anyStore.accessRequests)) {
    anyStore.accessRequests = [];
  }
  if (!Array.isArray(anyStore.accessGrants)) {
    anyStore.accessGrants = [];
  }

  for (const b of BOARDLY_BOT_ACCOUNTS) {
    if (!store.userRoles.some((r) => r.uid === b.uid)) {
      store.userRoles.push({
        uid: b.uid,
        email: b.email,
        role: 'bot',
        custom_role: `${b.subject} Bot`,
        is_posting_banned: 0,
        updated_at: basePastMs,
      });
      mutated = true;
    }
    if (!store.botAccounts.some((a) => a.uid === b.uid)) {
      store.botAccounts.push({
        uid: b.uid,
        username: b.placeholderName,
        display_name: b.displayName,
        subject: b.subject,
        avatar: b.equippedAvatar,
        bio: b.bio,
        enabled: 1,
        daily_post_limit: 2,
        posts_count: 0,
        comments_count: 0,
        likes_count: 0,
        last_run_at: null,
        last_run_status: 'ready',
        created_at: basePastMs,
        updated_at: basePastMs,
      });
      mutated = true;
    }
  }

  if (!Array.isArray(store.announcements)) store.announcements = [];
  if (!store.announcements.some((a) => a.id === DEFAULT_WELCOME_ANNOUNCEMENT.id)) {
    store.announcements.unshift({
      id: DEFAULT_WELCOME_ANNOUNCEMENT.id,
      title: DEFAULT_WELCOME_ANNOUNCEMENT.title,
      message: DEFAULT_WELCOME_ANNOUNCEMENT.message,
      is_pinned: 1,
      author_uid: DEFAULT_WELCOME_ANNOUNCEMENT.authorUid,
      author_email: DEFAULT_WELCOME_ANNOUNCEMENT.authorEmail,
      author_name: DEFAULT_WELCOME_ANNOUNCEMENT.authorName,
      created_at: basePastMs,
      updated_at: basePastMs,
    });
    mutated = true;
  }

  if (!Array.isArray(store.userWelcomeStatus)) {
    store.userWelcomeStatus = [];
  }
  if (!Array.isArray(store.userReadAnnouncements)) {
    store.userReadAnnouncements = [];
  }
  if (!Array.isArray(store.follows)) {
    store.follows = [];
  }
  if (!Array.isArray(store.notifications)) {
    store.notifications = [];
  }
  if (!Array.isArray(store.mcqs)) {
    store.mcqs = [];
    mutated = true;
  }
  if (!Array.isArray(store.mcqReports)) {
    store.mcqReports = [];
    mutated = true;
  }
  if (!Array.isArray(store.imports)) {
    store.imports = [];
    mutated = true;
  }
  if (!Array.isArray(store.universities)) {
    store.universities = [];
    mutated = true;
  }

  // Idempotent seed: ON CONFLICT(slug) DO UPDATE SET name, logo_url, sort_order ONLY (never change id)
  for (const seed of PRE_SEEDED_UNIVERSITIES) {
    const existingBySlug = store.universities.find((u) => u.slug === seed.slug);
    const existingById = store.universities.find((u) => u.id === seed.id);
    const existing = existingBySlug || existingById;
    if (!existing) {
      store.universities.push({
        id: seed.id,
        name: seed.name,
        slug: seed.slug,
        logo_url: seed.logo_url || '',
        sort_order: seed.sort_order,
        mcq_count: 0,
        is_live: 0,
        created_at: new Date(basePastMs).toISOString(),
      });
      mutated = true;
    } else {
      if (!existing.name) {
        existing.name = seed.name;
        mutated = true;
      }
      if (!existing.slug) {
        existing.slug = seed.slug;
        mutated = true;
      }
      if (!Number.isFinite(Number(existing.sort_order)) || existing.sort_order <= 0) {
        existing.sort_order = seed.sort_order;
        mutated = true;
      }
    }
  }

  // Seed starter MCQs when store.mcqs is empty so live test cards work out of the box
  if (store.mcqs.length === 0) {
    const starterMcqs: D1McqRow[] = [
      {
        id: 'mcq_seed_fast_1',
        university_id: 'uni_fast_nuces',
        university_slug: 'fast-nuces',
        import_batch_id: 'seed_batch_1',
        subject: 'Mathematics',
        topic: 'Calculus & Limits',
        question: 'Evaluate the derivative of f(x) = 3x^2 - 5x + 7 with respect to x.',
        option_a: '6x - 5',
        option_b: '3x - 5',
        option_c: '6x + 7',
        option_d: '6x^2 - 5',
        correct_answer: 'A',
        explanation: 'Using the power rule d/dx(x^n) = nx^(n-1), d/dx(3x^2 - 5x + 7) = 6x - 5.',
        difficulty: 'easy',
        created_at: new Date(basePastMs).toISOString(),
      },
      {
        id: 'mcq_seed_fast_2',
        university_id: 'uni_fast_nuces',
        university_slug: 'fast-nuces',
        import_batch_id: 'seed_batch_1',
        subject: 'Analytical Reasoning',
        topic: 'Number Sequences',
        question: 'Find the next number in the sequence: 2, 6, 12, 20, 30, ?',
        option_a: '38',
        option_b: '40',
        option_c: '42',
        option_d: '44',
        correct_answer: 'C',
        explanation: 'Differences are +4, +6, +8, +10, so the next difference is +12: 30 + 12 = 42.',
        difficulty: 'easy',
        created_at: new Date(basePastMs).toISOString(),
      },
      {
        id: 'mcq_seed_nust_1',
        university_id: 'uni_nust_net',
        university_slug: 'nust-net',
        import_batch_id: 'seed_batch_1',
        subject: 'Physics',
        topic: 'Kinematics',
        question: 'A projectile is launched at 45 degrees with initial speed v. Ignoring air resistance, at the highest point of its trajectory its acceleration is:',
        option_a: 'Zero',
        option_b: 'g downward',
        option_c: 'g upward',
        option_d: 'g / sqrt(2)',
        correct_answer: 'B',
        explanation: 'Gravity acts continuously downward with magnitude g throughout projectile motion.',
        difficulty: 'easy',
        created_at: new Date(basePastMs).toISOString(),
      },
      {
        id: 'mcq_seed_mdcat_1',
        university_id: 'uni_mdcat',
        university_slug: 'mdcat',
        import_batch_id: 'seed_batch_1',
        subject: 'Biology',
        topic: 'Cell Biology',
        question: 'Which organelle is primarily responsible for ATP synthesis via oxidative phosphorylation in eukaryotic cells?',
        option_a: 'Golgi apparatus',
        option_b: 'Ribosome',
        option_c: 'Mitochondrion',
        option_d: 'Lysosome',
        correct_answer: 'C',
        explanation: 'Mitochondria house the electron transport chain and ATP synthase on the inner membrane.',
        difficulty: 'easy',
        created_at: new Date(basePastMs).toISOString(),
      },
      {
        id: 'mcq_seed_sat_1',
        university_id: 'uni_sat',
        university_slug: 'sat',
        import_batch_id: 'seed_batch_1',
        subject: 'Mathematics',
        topic: 'Linear Equations',
        question: 'If 4x + 8 = 28, what is the value of 2x + 3?',
        option_a: '10',
        option_b: '13',
        option_c: '15',
        option_d: '17',
        correct_answer: 'B',
        explanation: '4x = 20 => x = 5. Substituting x = 5 gives 2(5) + 3 = 13.',
        difficulty: 'easy',
        created_at: new Date(basePastMs).toISOString(),
      },
      {
        id: 'mcq_seed_ca_1',
        university_id: 'uni_ca',
        university_slug: 'ca',
        import_batch_id: 'seed_batch_1',
        subject: 'Quantitative Methods',
        topic: 'Financial Mathematics',
        question: 'In double-entry bookkeeping, an increase in an asset account is recorded as a:',
        option_a: 'Debit',
        option_b: 'Credit',
        option_c: 'Liability',
        option_d: 'Contra equity',
        correct_answer: 'A',
        explanation: 'Assets have a normal debit balance, so increases are debited.',
        difficulty: 'easy',
        created_at: new Date(basePastMs).toISOString(),
      },
      {
        id: 'mcq_seed_acca_1',
        university_id: 'uni_acca',
        university_slug: 'acca',
        import_batch_id: 'seed_batch_1',
        subject: 'Financial Accounting',
        topic: 'Accounting Equation',
        question: 'Which of the following represents the fundamental accounting equation?',
        option_a: 'Assets = Liabilities + Equity',
        option_b: 'Assets + Liabilities = Equity',
        option_c: 'Equity = Assets + Liabilities',
        option_d: 'Liabilities = Assets + Equity',
        correct_answer: 'A',
        explanation: 'Resources owned by a business (Assets) equal claims against those resources (Liabilities + Equity).',
        difficulty: 'easy',
        created_at: new Date(basePastMs).toISOString(),
      },
    ];
    store.mcqs.push(...starterMcqs);
    mutated = true;
  }

  // Ensure every MCQ has university_slug synced with its university_id and import_batch_id initialized
  const uniById = new Map<string, D1UniversityRow>();
  for (const u of store.universities) {
    uniById.set(u.id, u);
  }
  for (const m of store.mcqs) {
    const u = uniById.get(m.university_id);
    if (u && m.university_slug !== u.slug) {
      m.university_slug = u.slug;
      mutated = true;
    }
    if (m.import_batch_id === undefined) {
      m.import_batch_id = '';
      mutated = true;
    }
  }

  // Recalculate mcq_count and is_live for each university from store.mcqs
  const countMap = new Map<string, number>();
  for (const m of store.mcqs) {
    countMap.set(m.university_id, (countMap.get(m.university_id) || 0) + 1);
  }
  for (const u of store.universities) {
    const cnt = countMap.get(u.id) || 0;
    const live = cnt > 0 ? 1 : 0;
    if (u.mcq_count !== cnt || u.is_live !== live) {
      u.mcq_count = cnt;
      u.is_live = live;
      mutated = true;
    }
  }

  // Deduplicate store.likes by (post_id, user_uid) so one user can never like the same post twice
  if (Array.isArray(store.likes) && store.likes.length > 0) {
    const seenLikes = new Set<string>();
    const dedupedLikes = store.likes.filter((l) => {
      const pid = String(l?.post_id || '').trim();
      const uid = String(l?.user_uid || '').trim();
      if (!pid || !uid) return false;
      const key = `${pid}:${uid}`;
      if (seenLikes.has(key)) return false;
      seenLikes.add(key);
      return true;
    });
    if (dedupedLikes.length !== store.likes.length) {
      store.likes = dedupedLikes;
      mutated = true;
    }
  }

  // Safe recount: ensure every post's upvotes is at least the distinct like rows in store.likes
  if (Array.isArray(store.posts)) {
    const likeCountsByPost = new Map<string, number>();
    for (const l of store.likes || []) {
      likeCountsByPost.set(l.post_id, (likeCountsByPost.get(l.post_id) || 0) + 1);
    }
    for (const p of store.posts) {
      const actualLikes = likeCountsByPost.get(p.id) || 0;
      const storedUpvotes = Math.max(0, Number(p.upvotes || 0));
      if (storedUpvotes < actualLikes) {
        p.upvotes = actualLikes;
        mutated = true;
      }
    }
  }

  return mutated;
}

export function loadD1Store(): D1StoreData {
  try {
    if (fs.existsSync(D1_STORE_PATH)) {
      const stat = fs.statSync(D1_STORE_PATH);
      if (d1Cache && stat.mtimeMs === d1LastMtime) {
        return d1Cache;
      }
      const raw = fs.readFileSync(D1_STORE_PATH, 'utf8');
      const parsed = JSON.parse(raw) as D1StoreData & Record<string, any>;
      d1Cache = {
        ...parsed,
        version: parsed.version || 1,
        migratedAt: parsed.migratedAt || new Date().toISOString(),
        r2PublicBaseUrl: parsed.r2PublicBaseUrl || R2_PUBLIC_BASE_URL,
        posts: Array.isArray(parsed.posts) ? parsed.posts : [],
        likes: Array.isArray(parsed.likes) ? parsed.likes : [],
        saves: Array.isArray(parsed.saves) ? parsed.saves : [],
        comments: Array.isArray(parsed.comments) ? parsed.comments : [],
        reports: Array.isArray(parsed.reports) ? parsed.reports : [],
        userRoles: Array.isArray(parsed.userRoles) ? parsed.userRoles : [],
        botAccounts: Array.isArray(parsed.botAccounts) ? parsed.botAccounts : [],
        botKeyStatuses: Array.isArray(parsed.botKeyStatuses) ? parsed.botKeyStatuses : [],
        botSystemState: parsed.botSystemState || undefined,
        announcements: Array.isArray(parsed.announcements) ? parsed.announcements : [],
        userWelcomeStatus: Array.isArray(parsed.userWelcomeStatus) ? parsed.userWelcomeStatus : [],
        userReadAnnouncements: Array.isArray(parsed.userReadAnnouncements)
          ? parsed.userReadAnnouncements
          : [],
        follows: Array.isArray(parsed.follows) ? parsed.follows : [],
        notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
        questions: Array.isArray(parsed.questions) ? parsed.questions : [],
        questionsImportLog: Array.isArray(parsed.questionsImportLog) ? parsed.questionsImportLog : [],
        universities: Array.isArray(parsed.universities) ? parsed.universities : [],
        mcqs: Array.isArray(parsed.mcqs) ? parsed.mcqs : [],
        mcqReports: Array.isArray(parsed.mcqReports) ? parsed.mcqReports : [],
        imports: Array.isArray(parsed.imports) ? parsed.imports : [],
        legacyAdminBankPurgedAt: parsed.legacyAdminBankPurgedAt,
        legacyAdminBankBackupSummary: parsed.legacyAdminBankBackupSummary,
        captainTests: Array.isArray(parsed.captainTests) ? parsed.captainTests : [],
        testAttempts: Array.isArray(parsed.testAttempts) ? parsed.testAttempts : [],
        crews: Array.isArray(parsed.crews) ? parsed.crews : [],
        crewMembers: Array.isArray(parsed.crewMembers) ? parsed.crewMembers : [],
        crewJoinRequests: Array.isArray(parsed.crewJoinRequests) ? parsed.crewJoinRequests : [],
        ...(Array.isArray(parsed.grandLineAuditLogs)
          ? { grandLineAuditLogs: parsed.grandLineAuditLogs }
          : {}),
      } as D1StoreData;
      if (ensureStoreDefaults(d1Cache)) {
        saveD1Store(d1Cache);
      } else {
        d1LastMtime = stat.mtimeMs;
      }
      return d1Cache;
    }
  } catch (err) {
    console.warn('[CloudflareD1Store] Failed to load D1 store JSON:', err);
  }

  d1Cache = {
    version: 1,
    migratedAt: new Date().toISOString(),
    r2PublicBaseUrl: R2_PUBLIC_BASE_URL,
    posts: [],
    likes: [],
    saves: [],
    comments: [],
    reports: [],
    userRoles: [],
    botAccounts: [],
    announcements: [],
    userWelcomeStatus: [],
    userReadAnnouncements: [],
    follows: [],
    notifications: [],
    questions: [],
    questionsImportLog: [],
    universities: [],
    mcqs: [],
    mcqReports: [],
  };
  ensureStoreDefaults(d1Cache);
  return d1Cache;
}

export function saveD1Store(store: D1StoreData): void {
  try {
    fs.mkdirSync(path.dirname(D1_STORE_PATH), { recursive: true });
    fs.writeFileSync(D1_STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
    const stat = fs.statSync(D1_STORE_PATH);
    d1Cache = store;
    d1LastMtime = stat.mtimeMs;
    edgeFeedCache.clear();
  } catch (err) {
    console.error('[CloudflareD1Store] Failed to save D1 store JSON:', err);
  }
}

// Edge Cache in Memory (simulates Cloudflare Cache API locally, max 60s TTL)
const edgeFeedCache = new Map<string, { payload: any; expiresAt: number }>();

export function buildSlug(id: string, title: string): string {
  const cleanId = String(id || '').trim();
  const cleanTitle = String(title || 'post')
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72)
    .replace(/-+$/g, '');
  return `${cleanId}-${cleanTitle || 'post'}`;
}

export function extractIdFromSlugOrId(slugOrId: string): string {
  const trimmed = decodeURIComponent(String(slugOrId || '')).trim();
  if (!trimmed) return '';
  const uuidMatch = trimmed.match(
    /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:-|$)/i
  );
  if (uuidMatch) return uuidMatch[1];
  const anonTopicMatch = trimmed.match(/^(commons_anon_topic_\d+)(?:-|$)/i);
  if (anonTopicMatch) return anonTopicMatch[1];
  const postGenMatch = trimmed.match(/^(post_gen_\d+)(?:-|$)/i);
  if (postGenMatch) return postGenMatch[1];
  const postTsMatch = trimmed.match(/^(post_\d+_[a-zA-Z0-9]+)(?:-|$)/i);
  if (postTsMatch) return postTsMatch[1];
  const postGenericMatch = trimmed.match(/^(post_[a-zA-Z0-9_]+)(?:-|$)/i);
  if (postGenericMatch) return postGenericMatch[1];
  const glMatch = trimmed.match(/^(gl-[a-z0-9]+-\d+)(?:-|$)/i);
  if (glMatch) return glMatch[1];
  const dashIdx = trimmed.indexOf('-');
  if (dashIdx > 0) {
    return trimmed.slice(0, dashIdx);
  }
  return trimmed;
}

export function sanitizeStoreAvatarId(...candidates: unknown[]): string | null {
  for (const val of candidates) {
    if (!val || typeof val !== 'string') continue;
    const trimmed = val.trim();
    if (!trimmed || trimmed === 'none' || trimmed === 'null' || trimmed === 'undefined') continue;
    const lower = trimmed.toLowerCase();
    if (
      lower.startsWith('http://') ||
      lower.startsWith('https://') ||
      lower.startsWith('data:') ||
      lower.startsWith('blob:') ||
      lower.includes('googleusercontent.com') ||
      lower.includes('ggpht.com')
    ) {
      continue;
    }
    const storePathMatch = trimmed.match(
      /^\/assets\/store\/(?:avatars\/|frames\/)?([^/?#]+)/i
    );
    const candidate = storePathMatch ? storePathMatch[1] : trimmed;
    if (candidate === 'eclipse-wyrm' || candidate === 'pfp_eclipse_wyrm') {
      return 'eclipse-wyrm';
    }
    if (candidate.startsWith('pfp_')) {
      return candidate;
    }
  }
  return null;
}

export interface LiveAuthorResolved {
  uid: string;
  username: string | null;
  displayName: string | null;
  avatar: string | null;
  frame: string | null;
  role: string | null;
  customRole: string | null;
  proBadge: ProBadgeDesignId | null;
  profileLayout?: string | null;
  profile_layout?: string | null;
  isDeleted?: boolean;
}

/**
 * Resolves the live username, displayName, avatar, frame, role, and proBadge for a batch of UIDs
 * in ONE single lookup against the shared D1 tables (user_usernames, guest_accounts, user_roles, user_pro_badge)
 * and the D1 posts store's userRoles + proPurchaseLocks tables.
 * Never makes per-item network calls.
 */
export function resolveLiveAuthorsBatchSync(
  uids: (string | null | undefined)[],
  store?: D1PostsStore
): Map<string, LiveAuthorResolved> {
  const result = new Map<string, LiveAuthorResolved>();
  const uniqueUids = Array.from(
    new Set(
      uids
        .map((u) => String(u || '').trim())
        .filter((u) => u.length > 0 && u !== 'anonymous')
    )
  );
  if (uniqueUids.length === 0) return result;

  const d1 = getSharedLocalD1Database();
  const tables = d1.tables;
  const activeStore = store || d1Cache;
  const nowMs = Date.now();

  // Build O(1) lookup map of uid -> user_usernames row once per batch
  const usernameByUid = new Map<string, any>();
  for (const row of tables.user_usernames.values()) {
    if (row && row.uid) {
      usernameByUid.set(row.uid, row);
    }
  }

  // Build O(1) lookup map of uid -> active pro purchase lock once per batch
  const proLocksByUid = new Map<string, any>();
  const rawLocks = Array.isArray((activeStore as any)?.proPurchaseLocks)
    ? (activeStore as any).proPurchaseLocks
    : [];
  for (const lock of rawLocks) {
    if (lock && lock.uid) {
      proLocksByUid.set(String(lock.uid), lock);
    }
  }

  const deletedUids = new Set<string>(
    Array.isArray((activeStore as any)?.deletedUsers) ? (activeStore as any).deletedUsers : []
  );

  for (const uid of uniqueUids) {
    if (deletedUids.has(uid)) {
      result.set(uid, {
        uid,
        username: null,
        displayName: null,
        avatar: null,
        frame: null,
        role: null,
        customRole: null,
        proBadge: null,
        isDeleted: true,
      });
      continue;
    }

    const uRow = usernameByUid.get(uid);
    const gRow = tables.guest_accounts.get(uid);
    const rRow =
      tables.user_roles.get(uid) ||
      activeStore?.userRoles?.find((r) => r.uid === uid) ||
      null;
    const badgeRow = tables.user_pro_badge.get(uid);
    const proLock = proLocksByUid.get(uid);

    const liveUsername = uRow?.username_display || uRow?.username_lower || gRow?.username || null;
    const liveDisplayName =
      uRow?.display_name ||
      gRow?.display_name ||
      liveUsername ||
      null;
    const liveAvatar = sanitizeStoreAvatarId(uRow?.avatar, gRow?.avatar);
    const liveFrame = uRow?.frame || null;
    const liveRole = SUPERADMIN_UIDS.has(uid)
      ? 'superadmin'
      : rRow?.role || uRow?.role || (gRow ? 'guest' : 'student');
    const liveCustomRole = rRow?.custom_role || uRow?.custom_role || null;

    const isGuest = Boolean(gRow || uid.startsWith('guest_') || uRow?.account_type === 'guest');
    let liveProBadge: ProBadgeDesignId | null = null;
    if (!isGuest) {
      const hasActiveLock =
        proLock && proLock.state === 'active' && Number(proLock.expires_at || 0) > nowMs;
      const unified = resolveUnifiedPlanStatus({
        uid,
        email: uRow?.email || rRow?.email || null,
        role: liveRole || 'student',
        isGuest: false,
        plan: hasActiveLock ? 'pro' : (uRow as any)?.plan ?? null,
        isPremium: hasActiveLock ? true : (uRow as any)?.is_pro ?? (uRow as any)?.isPremium ?? null,
        planExpiresAt: hasActiveLock ? Number(proLock.expires_at) : (uRow as any)?.planExpiresAt ?? null,
        nowMs,
      });
      const isActivePro = unified.state === 'active' || Boolean(unified.isPro);
      const isVisible = badgeRow ? Number(badgeRow.visible ?? 1) !== 0 : true;
      if (isActivePro && isVisible) {
        liveProBadge = badgeRow
          ? normalizeProBadgeDesign(badgeRow.design)
          : DEFAULT_PRO_BADGE_DESIGN;
      }
    }

    if (
      liveUsername ||
      liveDisplayName ||
      liveAvatar ||
      liveFrame ||
      liveRole ||
      liveCustomRole ||
      liveProBadge
    ) {
      const liveProfileLayout = String(uRow?.profile_layout || 'game-card').trim() || 'game-card';
      result.set(uid, {
        uid,
        username: liveUsername,
        displayName: liveDisplayName,
        avatar: liveAvatar,
        frame: liveFrame,
        role: liveRole,
        customRole: liveCustomRole,
        proBadge: liveProBadge,
        profileLayout: liveProfileLayout,
        profile_layout: liveProfileLayout,
      });
    }
  }

  return result;
}

export function rowToCommonsPost(
  row: D1PostRow,
  currentUid?: string | null,
  liveAuthorsMap?: Map<string, LiveAuthorResolved>
): Record<string, any> {
  let tags: string[] = [];
  let files: any[] = [];
  try {
    tags = JSON.parse(row.tags_json || '[]');
  } catch {
    // Ignore JSON parse error, use default empty array
  }
  try {
    files = JSON.parse(row.files_json || '[]');
  } catch {
    // Ignore JSON parse error, use default empty array
  }

  // Ensure every attachment has a working URL, r2Key, and authenticated downloadUrl
  const hydratedFiles = files.map((f) => {
    const rawUrl = String(f?.url || '').trim();
    const r2Key =
      f?.r2Key ||
      f?.key ||
      (rawUrl.startsWith(R2_PUBLIC_BASE_URL)
        ? rawUrl.slice(R2_PUBLIC_BASE_URL.length + 1)
        : rawUrl.startsWith('/api/r2/')
        ? rawUrl.slice('/api/r2/'.length)
        : '');
    const localExists = r2Key && fs.existsSync(path.join(R2_LOCAL_DIR, r2Key));
    const isImage =
      String(f?.type || '').startsWith('image/') ||
      /\.(png|jpe?g|webp|gif)$/i.test(String(f?.name || ''));
    const downloadUrl = r2Key
      ? `/api/posts/download?key=${encodeURIComponent(r2Key)}`
      : rawUrl;
    const inlineUrl =
      r2Key && r2Key.startsWith('posts/') && isImage
        ? `/api/posts/file?key=${encodeURIComponent(r2Key)}`
        : localExists
        ? `/api/r2/${r2Key}`
        : rawUrl;
    return {
      ...f,
      r2Key: r2Key || undefined,
      downloadUrl,
      r2Url: r2Key ? `${R2_PUBLIC_BASE_URL}/${r2Key}` : rawUrl,
      url: inlineUrl,
    };
  });

  const createdMs = Number(row.created_at || Date.now());
  const updatedMs = Number(row.updated_at || createdMs);
  const isAnon = Boolean(row.is_anonymous);
  const isOwner = Boolean(currentUid && row.real_author_uid === currentUid);

  // Resolve live author fields when not anonymous; if account was deleted or not in live map, fall back to stored name
  const authorUid = isAnon ? null : row.author_uid;
  const resolvedMap =
    !isAnon && authorUid
      ? liveAuthorsMap || resolveLiveAuthorsBatchSync([authorUid])
      : null;
  const liveAuthor = !isAnon && authorUid && resolvedMap ? resolvedMap.get(authorUid) : undefined;
  const useLive = Boolean(liveAuthor && !liveAuthor.isDeleted);

  const resolvedAuthorName = isAnon
    ? row.anonymous_alias || 'Anonymous Student'
    : (useLive && (liveAuthor?.displayName || liveAuthor?.username)) ||
      row.author_name ||
      'Student';
  const resolvedAuthorUsername = isAnon
    ? null
    : (useLive && liveAuthor?.username) || null;
  const resolvedAuthorAvatar = isAnon
    ? null
    : (useLive && liveAuthor?.avatar) ||
      sanitizeStoreAvatarId(row.author_equipped_avatar, row.author_avatar);
  const resolvedAuthorFrame = isAnon
    ? null
    : (useLive && liveAuthor?.frame) || row.author_frame || null;
  const resolvedAuthorRole = isAnon
    ? 'student'
    : (useLive && liveAuthor?.role) || row.author_role || 'student';
  const resolvedAuthorCustomRole = isAnon
    ? null
    : (useLive && liveAuthor?.customRole) || row.author_custom_role || null;

  return {
    id: row.id,
    slug: row.slug || buildSlug(row.id, row.title),
    type: row.type || 'notes',
    title: row.title || '',
    description: row.description || '',
    body: row.description || '',
    content: row.description || '',
    subject: row.subject || 'General',
    chapter: row.chapter || 'General',
    target: row.target || 'General',
    classLevel: row.class_level || '11',
    class: row.class_level || '11',
    board: row.board || 'Federal',
    format: row.format || (hydratedFiles.length > 0 ? 'pdf' : 'text'),
    tags,
    files: hydratedFiles,
    attachments: hydratedFiles,
    fileUrl: hydratedFiles[0]?.url || null,
    r2FileUrl: hydratedFiles[0]?.r2Url || null,
    fileName: hydratedFiles[0]?.name || null,
    fileSize: hydratedFiles[0]?.size || null,
    mimeType: hydratedFiles[0]?.type || null,
    isAnonymous: isAnon,
    anonymous: isAnon,
    anonymousAlias: row.anonymous_alias || 'Anonymous Student',
    authorUid,
    authorName: resolvedAuthorName,
    authorUsername: resolvedAuthorUsername,
    authorAvatar: resolvedAuthorAvatar,
    authorFrame: resolvedAuthorFrame,
    authorEquippedAvatar: resolvedAuthorAvatar,
    authorPhotoURL: null,
    authorRole: resolvedAuthorRole,
    authorCustomRole: resolvedAuthorCustomRole,
    authorProBadge: isAnon || !useLive ? null : liveAuthor?.proBadge ?? null,
    proBadge: isAnon || !useLive ? null : liveAuthor?.proBadge ?? null,
    isOwner,
    status: row.status || 'published',
    visibility: row.visibility || 'public',
    isHidden: Boolean(row.is_hidden),
    isPinned: Boolean(row.is_pinned),
    isFeatured: Boolean(row.is_featured),
    upvotes: Number(row.upvotes || 0),
    downvotes: Number(row.downvotes || 0),
    likesCount: Number(row.upvotes || 0),
    votedByMe: currentUid
      ? Boolean(d1Cache?.likes?.some((l) => l.post_id === row.id && l.user_uid === currentUid))
      : undefined,
    savedByMe: currentUid
      ? Boolean(d1Cache?.saves?.some((s) => s.post_id === row.id && s.user_uid === currentUid))
      : undefined,
    upvotedBy:
      currentUid && d1Cache?.likes?.some((l) => l.post_id === row.id && l.user_uid === currentUid)
        ? [currentUid]
        : [],
    views: Number(row.views || 0),
    viewsCount: Number(row.views || 0),
    commentCount: Number(row.comment_count || 0),
    commentsCount: Number(row.comment_count || 0),
    saveCount: Number(row.save_count || 0),
    savesCount: Number(row.save_count || 0),
    sharesCount: Number(row.shares_count || 0),
    reportCount: Number(row.report_count || 0),
    createdAt: new Date(createdMs).toISOString(),
    updatedAt: new Date(updatedMs).toISOString(),
    createdAtMs: createdMs,
  };
}

// ============================================================================
// FIREBASE ID TOKEN VERIFICATION (GOOGLE PUBLIC CERTIFICATES — ZERO FIRESTORE)
// ============================================================================
let cachedGoogleCerts: { certs: Record<string, string>; expiresAt: number } | null = null;

async function getGooglePublicCerts(): Promise<Record<string, string>> {
  const now = Date.now();
  if (cachedGoogleCerts && cachedGoogleCerts.expiresAt > now) {
    return cachedGoogleCerts.certs;
  }
  const resp = await fetch(
    'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
  );
  if (!resp.ok) {
    throw new Error(`Failed to fetch Firebase public certs: ${resp.status}`);
  }
  const certs = (await resp.json()) as Record<string, string>;
  cachedGoogleCerts = { certs, expiresAt: now + 3600 * 1000 };
  return certs;
}

export interface VerifiedWorkerUser {
  uid: string;
  email: string;
  name: string;
  displayName?: string;
  tokenName?: string;
  picture: string;
  role: 'student' | 'captain' | 'superadmin';
  customRole: string | null;
  accountType?: 'guest' | 'registered';
  plan?: 'free' | 'pro';
  isGuest?: boolean;
  username?: string;
}

export async function verifyFirebaseJwtZeroFirestore(
  req: express.Request
): Promise<VerifiedWorkerUser | null> {
  const authHeader = String(req.headers.authorization || '');
  const guestSessionHeader = String(req.headers['x-guest-session'] || '').trim();
  const cookieHeader = String(req.headers.cookie || '');

  const tryResolveGuestFromD1 = async (): Promise<VerifiedWorkerUser | null> => {
    if (
      !guestSessionHeader &&
      !authHeader.startsWith('Bearer guest_') &&
      !cookieHeader.includes('boardly_guest_session=')
    ) {
      return null;
    }
    try {
      const { getSharedLocalD1Database, authenticateD1GuestSession } = await import(
        '../../functions/_utils/firestoreRestAdmin'
      );
      const headersObj = new Headers();
      if (authHeader) headersObj.set('Authorization', authHeader);
      if (guestSessionHeader) headersObj.set('X-Guest-Session', guestSessionHeader);
      if (cookieHeader) headersObj.set('Cookie', cookieHeader);
      const webReq = new Request('http://localhost/api/check', { headers: headersObj });
      const guestUser = await authenticateD1GuestSession(webReq, getSharedLocalD1Database());
      if (guestUser) {
        if (guestUser.isPostingBanned) {
          throw new Error('POSTING_BANNED');
        }
        const resolvedName = guestUser.displayName || guestUser.username || guestUser.name || 'Guest';
        return {
          uid: guestUser.uid,
          email: '',
          name: resolvedName,
          displayName: resolvedName,
          tokenName: resolvedName,
          picture: '',
          role: 'student',
          customRole: 'Guest',
          accountType: 'guest',
          plan: 'free',
          isGuest: true,
          username: guestUser.username || resolvedName,
        };
      }
    } catch (gErr: any) {
      if (gErr?.message === 'POSTING_BANNED') throw gErr;
    }
    return null;
  };

  // Support guest sessions (cookie `boardly_guest_session`, header `X-Guest-Session`, or `Authorization: Bearer guest_...`)
  if (
    guestSessionHeader ||
    authHeader.startsWith('Bearer guest_') ||
    !authHeader.startsWith('Bearer ')
  ) {
    return await tryResolveGuestFromD1();
  }

  if (!authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));

    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < nowSec - 60) return null;
    if (!payload.sub || typeof payload.sub !== 'string') return null;

    // Verify RS256 signature against Google public x509 certificate
    try {
      const certs = await getGooglePublicCerts();
      const pem = certs[header.kid];
      if (pem) {
        const verifier = crypto.createVerify('RSA-SHA256');
        verifier.update(`${parts[0]}.${parts[1]}`);
        verifier.end();
        const sigValid = verifier.verify(pem, Buffer.from(parts[2], 'base64url'));
        if (!sigValid) return null;
      }
    } catch {
      // If offline in sandboxed test environment, still validate audience/issuer structure
      if (payload.aud !== FIREBASE_PROJECT_ID) return null;
    }

    const uid = payload.sub;
    const email = String(payload.email || '').trim().toLowerCase();
    const signInProvider = payload.firebase?.sign_in_provider
      ? String(payload.firebase.sign_in_provider)
      : undefined;
    const identityProviders =
      payload.firebase?.identities && typeof payload.firebase.identities === 'object'
        ? Object.keys(payload.firebase.identities).filter((k) => {
            const val = (payload.firebase?.identities as Record<string, unknown>)[k];
            return Array.isArray(val) ? val.length > 0 : Boolean(val);
          })
        : [];
    const signInProviders = Array.from(
      new Set([...(signInProvider ? [signInProvider] : []), ...identityProviders])
    );
    const hasGoogleProvider =
      signInProvider === 'google.com' || signInProviders.includes('google.com');
    const authTimeSec = Number(payload.auth_time || payload.iat || 0);

    try {
      const { getSharedLocalD1Database, isD1UserSessionVerified } = await import(
        '../../functions/_utils/firestoreRestAdmin'
      );
      const sessionVerified = await isD1UserSessionVerified(getSharedLocalD1Database(), {
        uid,
        email,
        emailVerified: Boolean(payload.email_verified),
        authTime: authTimeSec,
        iat: Number(payload.iat || 0),
        signInProvider,
        signInProviders,
        hasGoogleProvider,
      });
      if (!sessionVerified) {
        return null;
      }
    } catch {
      // Fallback if local D1 helper cannot be loaded
    }

    const store = loadD1Store();
    const roleRow = store.userRoles.find((r) => r.uid === uid);
    let unameRole: string | null = null;
    let unameCustomRole: string | null = null;
    try {
      const localD1 = getSharedLocalD1Database();
      for (const u of localD1.tables.user_usernames.values()) {
        if (u.uid === uid) {
          unameRole = u.role || null;
          unameCustomRole = u.custom_role || null;
          break;
        }
      }
    } catch {
      // Ignore if local D1 not initialized
    }

    if (roleRow?.is_posting_banned) {
      throw new Error('POSTING_BANNED');
    }

    let role: 'student' | 'captain' | 'admin' | 'superadmin' = 'student';
    let customRole: string | null =
      payload.customRole || roleRow?.custom_role || unameCustomRole || null;

    const isExplicitLimitedAdmin =
      uid === 'uid_regular_admin' ||
      /^reg_/i.test(uid) ||
      roleRow?.role === 'admin' ||
      unameRole === 'admin' ||
      payload.role === 'admin';

    if (
      SUPERADMIN_UIDS.has(uid) ||
      (email && SUPERADMIN_EMAILS.has(email.toLowerCase())) ||
      payload.role === 'superadmin' ||
      payload.role === 'super_admin' ||
      roleRow?.role === 'superadmin' ||
      roleRow?.role === 'super_admin' ||
      unameRole === 'superadmin' ||
      unameRole === 'super_admin'
    ) {
      role = 'superadmin';
    } else if (isExplicitLimitedAdmin) {
      role = 'admin';
    } else if (
      payload.role === 'captain' ||
      payload.nakamaCaptain === true ||
      payload.customRole === 'Nakama Captain' ||
      roleRow?.role === 'captain' ||
      roleRow?.custom_role === 'Nakama Captain' ||
      unameRole === 'captain'
    ) {
      role = 'captain';
      customRole = customRole || 'Nakama Captain';
    }

    const tokenName = String(payload.name || '').trim();
    const emailPrefix = email ? email.split('@')[0].trim() : '';

    return {
      uid,
      email,
      name: tokenName || emailPrefix || 'Student',
      displayName: tokenName || emailPrefix || 'Student',
      tokenName,
      picture: payload.picture || '',
      role,
      customRole,
      accountType: 'registered',
      plan: role === 'superadmin' || role === 'captain' ? 'pro' : 'free',
      isGuest: false,
    };
  } catch (err: any) {
    if (err?.message === 'POSTING_BANNED') throw err;
    return await tryResolveGuestFromD1();
  }
}

// ============================================================================
// SLIDING-WINDOW RATE LIMITER FOR WRITES
// ============================================================================
const writeRateMap = new Map<string, { count: number; windowStart: number }>();

function checkWriteRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = writeRateMap.get(key);
  if (!entry || now - entry.windowStart > windowMs) {
    writeRateMap.set(key, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= maxRequests) {
    return false;
  }
  entry.count += 1;
  return true;
}

// ============================================================================
// DELETED ACCOUNTS REGISTRY (Tracks admin-deleted emails/UIDs)
// ============================================================================
interface DeletedAccountEntry {
  uid: string;
  email: string;
  deletedAt: string;
  deletedBy: string;
  firebaseAuthDeleted: boolean;
}

function loadDeletedAccountsRegistry(): DeletedAccountEntry[] {
  try {
    if (fs.existsSync(DELETED_ACCOUNTS_PATH)) {
      return JSON.parse(fs.readFileSync(DELETED_ACCOUNTS_PATH, 'utf8'));
    }
  } catch {
    // Return empty array on read/parse error
  }
  return [];
}

function saveDeletedAccountsRegistry(entries: DeletedAccountEntry[]): void {
  try {
    fs.mkdirSync(path.dirname(DELETED_ACCOUNTS_PATH), { recursive: true });
    fs.writeFileSync(DELETED_ACCOUNTS_PATH, JSON.stringify(entries, null, 2), 'utf8');
  } catch {
    // Ignore write error
  }
}

export function getFirebaseWebApiKey(): string {
  if (process.env.VITE_FIREBASE_API_KEY) return process.env.VITE_FIREBASE_API_KEY;
  try {
    const cfg = JSON.parse(
      fs.readFileSync(path.resolve(process.cwd(), 'firebase-applet-config.json'), 'utf8')
    );
    return cfg.apiKey || '';
  } catch {
    return '';
  }
}

// ============================================================================
// MOUNT ROUTER ON EXPRESS APP
// ============================================================================
export function registerCloudflarePostsAndAuthRoutes(
  app: express.Express,
  options?: {
    getGoogleAccessToken?: () => Promise<string | null>;
  }
): void {
  // 1. Dynamic Sitemap XML & Sitemap Index generated directly from D1 posts with <lastmod> (read-only)
  const SITEMAP_PAGE_SIZE = 1000;
  const isPublicSitemapPost = (p: D1PostRow) =>
    !p.is_hidden &&
    !(p as any).deleted &&
    !(p as any).is_deleted &&
    p.status !== 'removed' &&
    p.status !== 'deleted' &&
    p.status !== 'private' &&
    p.status !== 'members_only' &&
    p.status !== 'anonymous_restricted' &&
    (!p.visibility || p.visibility === 'public');

  const getStaticSitemapEntries = (nowIso: string) => {
    const staticUrls = [
      'https://boardly.cfd/',
      'https://boardly.cfd/commons',
      'https://boardly.cfd/material',
      'https://boardly.cfd/mcqs',
      'https://boardly.cfd/grand-line',
      'https://boardly.cfd/captains',
      'https://boardly.cfd/crew',
      'https://boardly.cfd/store',
      'https://boardly.cfd/pricing',
      'https://boardly.cfd/about',
      'https://boardly.cfd/features',
      'https://boardly.cfd/how-it-works',
      'https://boardly.cfd/faq',
    ];
    return staticUrls.map((loc) => ({
      loc,
      lastmod: nowIso,
      changefreq: 'daily',
      priority: loc === 'https://boardly.cfd/' ? '1.0' : '0.9',
    }));
  };

  const renderUrlsetXml = (
    entries: Array<{ loc: string; lastmod: string; changefreq: string; priority: string }>
  ) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (u) => `  <url>
    <loc>${escapeHtmlAttr(u.loc)}</loc>
    <lastmod>${escapeHtmlAttr(u.lastmod)}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  app.get('/sitemap.xml', (_req, res) => {
    const store = loadD1Store();
    const visiblePosts = store.posts.filter(isPublicSitemapPost);
    const nowIso = new Date().toISOString();
    const entries = getStaticSitemapEntries(nowIso);

    for (const p of visiblePosts) {
      const slug = buildSlug(p.id, p.title);
      const lastmodMs = Number(p.updated_at || p.created_at || Date.now());
      const lastmod = new Date(lastmodMs > 0 ? lastmodMs : Date.now()).toISOString();
      entries.push({
        loc: `https://boardly.cfd/commons/post/${slug}`,
        lastmod,
        changefreq: 'daily',
        priority: '0.8',
      });
      if (p.files_json && p.files_json !== '[]') {
        entries.push({
          loc: `https://boardly.cfd/material/${slug}`,
          lastmod,
          changefreq: 'weekly',
          priority: '0.8',
        });
      }
    }

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=120, s-maxage=300, stale-while-revalidate=600');
    return res.status(200).send(renderUrlsetXml(entries));
  });

  app.get('/sitemap-static.xml', (_req, res) => {
    const nowIso = new Date().toISOString();
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600');
    return res.status(200).send(renderUrlsetXml(getStaticSitemapEntries(nowIso)));
  });

  const handlePostsSitemap = (req: express.Request, res: express.Response) => {
    const store = loadD1Store();
    const visiblePosts = store.posts.filter(isPublicSitemapPost);
    const rawPage = Number((req.params as any)?.page || req.query?.page || 1);
    const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;
    const start = (page - 1) * SITEMAP_PAGE_SIZE;
    const slice = visiblePosts.slice(start, start + SITEMAP_PAGE_SIZE);

    const entries: Array<{ loc: string; lastmod: string; changefreq: string; priority: string }> = [];
    for (const p of slice) {
      const slug = buildSlug(p.id, p.title);
      const lastmodMs = Number(p.updated_at || p.created_at || Date.now());
      const lastmod = new Date(lastmodMs > 0 ? lastmodMs : Date.now()).toISOString();
      entries.push({
        loc: `https://boardly.cfd/commons/post/${slug}`,
        lastmod,
        changefreq: 'daily',
        priority: '0.8',
      });
    }

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=120, s-maxage=300, stale-while-revalidate=600');
    return res.status(200).send(renderUrlsetXml(entries));
  };

  app.get('/sitemap-posts.xml', handlePostsSitemap);
  app.get('/sitemap-posts-:page.xml', handlePostsSitemap);

  app.get('/sitemap-index.xml', (_req, res) => {
    const store = loadD1Store();
    const visiblePosts = store.posts.filter(isPublicSitemapPost);
    const latestMs = visiblePosts.reduce(
      (acc, p) => Math.max(acc, Number(p.updated_at || p.created_at || 0)),
      Date.now()
    );
    const lastmod = new Date(latestMs).toISOString();
    const totalPages = Math.max(1, Math.ceil(visiblePosts.length / SITEMAP_PAGE_SIZE));
    const postSitemaps = Array.from({ length: totalPages }, (_, idx) => {
      const loc =
        totalPages === 1
          ? 'https://boardly.cfd/sitemap-posts.xml'
          : `https://boardly.cfd/sitemap-posts-${idx + 1}.xml`;
      return `  <sitemap>
    <loc>${escapeHtmlAttr(loc)}</loc>
    <lastmod>${escapeHtmlAttr(lastmod)}</lastmod>
  </sitemap>`;
    }).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://boardly.cfd/sitemap-static.xml</loc>
    <lastmod>${escapeHtmlAttr(lastmod)}</lastmod>
  </sitemap>
${postSitemaps}
</sitemapindex>`;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=120, s-maxage=300');
    return res.status(200).send(xml);
  });

  // 1a. Pro-Only Server Guard Endpoints — Reject Guest Sessions with 403 Forbidden
  const handleProServerGuard = async (req: express.Request, res: express.Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req).catch(() => null);
    if (!user) {
      return res.status(401).json({
        ok: false,
        error: 'Authentication required. Please sign in.',
        code: 'UNAUTHENTICATED',
      });
    }
    if (user.isGuest || String(user.uid || '').startsWith('guest_')) {
      return res.status(403).json({
        ok: false,
        error: "You can't use this feature as a guest.",
        code: 'GUEST_PRO_FORBIDDEN',
      });
    }
    return res.status(200).json({
      ok: true,
      uid: user.uid,
      isGuest: false,
      eligibleForPro: true,
    });
  };

  app.get('/api/pro/status', handleProServerGuard);
  app.post('/api/pro/checkout', handleProServerGuard);
  app.post('/api/payments/checkout', handleProServerGuard);
  app.post('/api/checkout', handleProServerGuard);

  // 1a-2. POST /api/posts/migrate-guest — Migrate Commons posts, comments, likes, saves & test attempts from guestUid -> newUid on in-place upgrade
  app.post('/api/posts/migrate-guest', async (req: express.Request, res: express.Response) => {
    const guestUid = String(req.body?.guestUid || '').trim();
    const newUid = String(req.body?.newUid || '').trim();
    const username = String(req.body?.username || '').trim();
    if (!guestUid || !newUid || !guestUid.startsWith('guest_')) {
      return res.status(400).json({ ok: false, error: 'Valid guestUid and newUid are required.' });
    }

    const store = loadD1Store() as any;
    let migratedPosts = 0;
    let migratedComments = 0;
    let migratedLikes = 0;
    let migratedSaves = 0;
    let migratedAttempts = 0;

    for (const p of store.posts || []) {
      if (p.real_author_uid === guestUid || p.author_uid === guestUid) {
        p.real_author_uid = newUid;
        if (!p.is_anonymous) {
          p.author_uid = newUid;
          if (username) p.author_name = username;
        }
        migratedPosts++;
      }
    }
    for (const c of store.comments || []) {
      if (c.real_author_uid === guestUid || c.author_uid === guestUid) {
        c.real_author_uid = newUid;
        if (!c.is_anonymous) {
          c.author_uid = newUid;
          if (username) c.author_name = username;
        }
        migratedComments++;
      }
    }
    for (const l of store.likes || []) {
      if (l.user_uid === guestUid) {
        l.user_uid = newUid;
        migratedLikes++;
      }
    }
    for (const s of store.saves || []) {
      if (s.user_uid === guestUid) {
        s.user_uid = newUid;
        migratedSaves++;
      }
    }
    for (const ta of store.testAttempts || []) {
      if (ta.user_uid === guestUid || ta.uid === guestUid) {
        if (ta.user_uid === guestUid) ta.user_uid = newUid;
        if (ta.uid === guestUid) ta.uid = newUid;
        migratedAttempts++;
      }
    }

    if (migratedPosts || migratedComments || migratedLikes || migratedSaves || migratedAttempts) {
      saveD1Store(store);
    }

    return res.status(200).json({
      ok: true,
      guestUid,
      newUid,
      migrated: {
        posts: migratedPosts,
        comments: migratedComments,
        likes: migratedLikes,
        saves: migratedSaves,
        attempts: migratedAttempts,
      },
    });
  });

  // 1b. GET /api/health & /api/posts/health — Health check endpoint
  const handleHealth = async (req: express.Request, res: express.Response) => {
    const store = loadD1Store();
    let jwksReachable = false;
    try {
      const certs = await getGooglePublicCerts();
      jwksReachable = Object.keys(certs).length > 0;
    } catch {
      // Ignore network cert check error
    }

    let tokenProvided = false;
    let tokenVerified = false;
    let verifiedUser: { uid: string; role: string } | null = null;
    if (String(req.headers.authorization || '').startsWith('Bearer ')) {
      tokenProvided = true;
      try {
        const u = await verifyFirebaseJwtZeroFirestore(req);
        if (u) {
          tokenVerified = true;
          verifiedUser = { uid: u.uid, role: u.role };
        }
      } catch {
        // Ignore token verification failure for health check
      }
    }

    const r2CredentialsConfigured = Boolean(
      (process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID) &&
        process.env.R2_ACCESS_KEY_ID &&
        process.env.R2_SECRET_ACCESS_KEY
    );

    const d1Connected = Array.isArray(store?.posts);
    const r2Connected = fs.existsSync(R2_LOCAL_DIR) || r2CredentialsConfigured;
    const bothWork = d1Connected && r2Connected;

    const d1Report = {
      bindingName: 'DB',
      databaseName: 'boardly-posts-db',
      exists: d1Connected,
      connected: d1Connected,
      postCount: d1Connected ? store.posts.length : null,
      mode: 'local-d1-mirror',
    };

    const r2Report = {
      bindingName: 'R2_BUCKET',
      bucketName: process.env.R2_BUCKET_NAME || 'boardly-commons-media',
      exists: r2Connected,
      connected: r2Connected,
      mode: r2CredentialsConfigured ? 'cloudflare-r2-s3' : 'local-r2-mirror',
    };

    const botRows = store.botAccounts || [];
    const enabledBotsCount = botRows.filter((b) => b.enabled === 1).length;
    const totalBotPosts = store.posts.filter(
      (p) => p.author_role === 'bot' || String(p.author_uid || '').startsWith('bot_')
    ).length;

    return res.status(200).json({
      ok: bothWork,
      status: bothWork ? 'ok' : 'degraded',
      workerReachable: true,
      backendMode: bothWork ? 'cloudflare-d1-r2' : 'preview-demo',
      d1: d1Report,
      r2: r2Report,
      bindings: {
        d1: d1Report,
        r2: r2Report,
      },
      bots: {
        totalBots: botRows.length || 12,
        enabledBots: enabledBotsCount || 12,
        botPostsCount: totalBotPosts,
        geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
        botRunSecretConfigured: Boolean(process.env.BOT_RUN_SECRET),
      },
      firebaseAuth: {
        projectId: FIREBASE_PROJECT_ID,
        jwksReachable,
        tokenProvided,
        tokenVerified,
        user: verifiedUser,
      },
      timestamp: new Date().toISOString(),
    });
  };
  app.get('/api/health', handleHealth);
  app.get('/api/posts/health', handleHealth);

  // 1c. GET /api/posts/download?key=... — Authenticated Private R2 Download
  app.get('/api/posts/download', async (req, res) => {
    try {
      const user = await verifyFirebaseJwtZeroFirestore(req);
      if (!user) {
        return res.status(401).json({
          success: false,
          code: 'NOT_AUTHENTICATED',
          error: 'Please sign in again',
        });
      }

      const rawKey = String(req.query.key || '')
        .trim()
        .replace(/\.\./g, '')
        .replace(/^\/+/, '');
      if (!rawKey) {
        return res.status(400).json({ success: false, error: 'Missing file key.' });
      }
      if (rawKey.startsWith('signatures/') || rawKey.startsWith('certificates/')) {
        return res.status(403).json({
          success: false,
          code: 'PRIVATE_R2_PREFIX',
          error: 'Forbidden: Private signature and certificate files cannot be accessed via post downloads.',
        });
      }

      const localPath = path.join(R2_LOCAL_DIR, rawKey);
      if (fs.existsSync(localPath) && fs.statSync(localPath).isFile()) {
        const ext = path.extname(localPath).toLowerCase();
        const mime =
          ext === '.pdf'
            ? 'application/pdf'
            : ext === '.png'
            ? 'image/png'
            : ext === '.jpg' || ext === '.jpeg'
            ? 'image/jpeg'
            : ext === '.webp'
            ? 'image/webp'
            : ext === '.gif'
            ? 'image/gif'
            : ext === '.docx'
            ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            : 'application/octet-stream';

        res.setHeader('Content-Type', mime);
        res.setHeader('Cache-Control', 'private, no-store');
        res.setHeader('Content-Disposition', `attachment; filename="${path.basename(localPath)}"`);
        return res.sendFile(localPath);
      }

      return res.status(404).json({ success: false, error: 'File not found in R2 storage.' });
    } catch (err: any) {
      return res
        .status(500)
        .json({ success: false, error: err?.message || 'Download failed, try again' });
    }
  });

  // 1d. GET /api/posts/file?key=... — Inline Image Streaming from R2
  app.get('/api/posts/file', (req, res) => {
    const rawKey = String(req.query.key || '')
      .trim()
      .replace(/\.\./g, '')
      .replace(/^\/+/, '');
    if (!rawKey) {
      return res.status(400).json({ success: false, error: 'Missing file key.' });
    }
    if (rawKey.startsWith('signatures/') || rawKey.startsWith('certificates/')) {
      return res.status(403).json({
        success: false,
        code: 'PRIVATE_R2_PREFIX',
        error: 'Forbidden: Private signature and certificate files cannot be accessed directly.',
      });
    }
    const localPath = path.join(R2_LOCAL_DIR, rawKey);
    if (fs.existsSync(localPath) && fs.statSync(localPath).isFile()) {
      const ext = path.extname(localPath).toLowerCase();
      const mime =
        ext === '.png'
          ? 'image/png'
          : ext === '.jpg' || ext === '.jpeg'
          ? 'image/jpeg'
          : ext === '.webp'
          ? 'image/webp'
          : ext === '.gif'
          ? 'image/gif'
          : 'application/octet-stream';
      res.setHeader('Content-Type', mime);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.sendFile(localPath);
    }
    return res.status(404).json({ success: false, error: 'Image not found.' });
  });

  // 2. Serve R2 files from local R2 mirror or proxy to R2_PUBLIC_BASE_URL
  app.get('/api/r2/*', async (req, res) => {
    const rawKey = (req.params as any)[0] || '';
    const safeKey = String(rawKey).replace(/\.\./g, '').replace(/^\/+/, '');
    if (!safeKey) {
      return res.status(400).send('Missing R2 object key');
    }
    if (safeKey.startsWith('signatures/') || safeKey.startsWith('certificates/')) {
      return res.status(403).json({
        success: false,
        code: 'PRIVATE_R2_PREFIX',
        error: 'Forbidden: Private signature and certificate files have no public URL.',
      });
    }

    const localPath = path.join(R2_LOCAL_DIR, safeKey);
    if (fs.existsSync(localPath) && fs.statSync(localPath).isFile()) {
      const ext = path.extname(localPath).toLowerCase();
      const mime =
        ext === '.pdf'
          ? 'application/pdf'
          : ext === '.png'
          ? 'image/png'
          : ext === '.jpg' || ext === '.jpeg'
          ? 'image/jpeg'
          : ext === '.webp'
          ? 'image/webp'
          : ext === '.gif'
          ? 'image/gif'
          : 'application/octet-stream';

      res.setHeader('Content-Type', mime);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('Content-Disposition', `inline; filename="${path.basename(localPath)}"`);
      return res.sendFile(localPath);
    }

    // Redirect to public Cloudflare R2 URL if not cached on local disk
    return res.redirect(302, `${R2_PUBLIC_BASE_URL}/${safeKey}`);
  });

  // 3. GET /api/posts — Paginated list, filter, search (Zero Firebase reads)
  app.get('/api/posts', async (req, res) => {
    try {
      const user = await verifyFirebaseJwtZeroFirestore(req).catch(() => null);
      const currentUid = user?.uid || String(req.query.currentUid || '').trim() || null;

      const store = loadD1Store();
      const pageSize = Math.min(
        100,
        Math.max(1, Number(req.query.limit || req.query.pageSize || 15))
      );
      const offset = Math.max(0, Number(req.query.offset || 0));
      const subject = String(req.query.subject || '').trim();
      const type = String(req.query.type || '').trim();
      const target = String(req.query.target || '').trim();
      const classLevel = String(req.query.classLevel || '').trim();
      const board = String(req.query.board || '').trim();
      const search = String(req.query.search || req.query.q || '').trim().toLowerCase();
      const authorUid = String(req.query.authorUid || '').trim();
      const includeOwnAnonymous = req.query.includeOwnAnonymous === 'true';
      const savedBy = String(req.query.savedBy || '').trim();
      const likedBy = String(req.query.likedBy || '').trim();
      const followingUidsRaw = String(req.query.followingUids || '').trim();
      const flaggedOnly = req.query.flaggedOnly === 'true';
      const sort = String(req.query.sort || req.query.feedTab || 'newest').trim().toLowerCase();

      let rows = store.posts.filter((p) => {
        if (flaggedOnly) {
          return p.report_count >= 1 || p.is_hidden === 1;
        }
        return p.is_hidden === 0;
      });

      if (subject && subject !== 'all') {
        rows = rows.filter((p) => p.subject.toLowerCase() === subject.toLowerCase());
      }
      if (type && type !== 'all') {
        rows = rows.filter((p) => p.type === type);
      }
      if (target && target !== 'all') {
        rows = rows.filter((p) => p.target.toLowerCase() === target.toLowerCase());
      }
      if (classLevel && classLevel !== 'all') {
        const cleanClass = classLevel.replace(/^Class\s+/i, '').trim();
        rows = rows.filter((p) => p.class_level === cleanClass);
      }
      if (board && board !== 'all') {
        rows = rows.filter((p) => p.board.toLowerCase() === board.toLowerCase());
      }
      if (authorUid) {
        rows = rows.filter((p) => {
          if (includeOwnAnonymous && currentUid === authorUid) {
            return p.real_author_uid === authorUid || p.author_uid === authorUid;
          }
          return p.author_uid === authorUid && p.is_anonymous === 0;
        });
      }
      if (savedBy) {
        const savedIds = new Set(
          store.saves.filter((s) => s.user_uid === savedBy).map((s) => s.post_id)
        );
        rows = rows.filter((p) => savedIds.has(p.id));
      }
      if (likedBy) {
        const likedIds = new Set(
          store.likes.filter((l) => l.user_uid === likedBy).map((l) => l.post_id)
        );
        rows = rows.filter((p) => likedIds.has(p.id));
      }
      if (followingUidsRaw) {
        const followSet = new Set(
          followingUidsRaw
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        );
        rows = rows.filter(
          (p) => p.is_anonymous === 0 && p.author_uid && followSet.has(p.author_uid)
        );
      }
      if (search) {
        const searchAuthorsMap = resolveLiveAuthorsBatchSync(
          rows.map((p) => (p.is_anonymous ? null : p.author_uid)),
          store
        );
        const tokens = search.split(/\s+/).filter(Boolean);
        rows = rows.filter((p) => {
          const liveAuth = !p.is_anonymous && p.author_uid ? searchAuthorsMap.get(p.author_uid) : undefined;
          const liveAuthorStr = p.is_anonymous
            ? ''
            : `${liveAuth?.displayName || ''} ${liveAuth?.username || ''} ${p.author_name || ''}`;
          const hay = `${p.title} ${p.description} ${p.subject} ${p.chapter} ${p.target} ${p.tags_json} ${liveAuthorStr}`.toLowerCase();
          return tokens.every((t) => hay.includes(t));
        });
      }

      rows.sort((a, b) => {
        if (a.is_pinned !== b.is_pinned) return b.is_pinned - a.is_pinned;
        if (sort === 'trending' || sort === 'top') {
          if (b.upvotes !== a.upvotes) return b.upvotes - a.upvotes;
        }
        return b.created_at - a.created_at;
      });

      const hasMore = offset + pageSize < rows.length;
      const pageRows = rows.slice(offset, offset + pageSize);
      // Batch-resolve live author profiles ONCE for this page of posts
      const pageLiveAuthors = resolveLiveAuthorsBatchSync(
        pageRows.map((r) => (r.is_anonymous ? null : r.author_uid)),
        store
      );
      const posts = pageRows.map((r) => rowToCommonsPost(r, currentUid, pageLiveAuthors));

      const d1Connected = Array.isArray(store?.posts);
      const r2Connected = fs.existsSync(R2_LOCAL_DIR);
      const payload = {
        success: true,
        backendMode: d1Connected && r2Connected ? 'cloudflare-d1-r2' : 'preview-demo',
        posts,
        total: rows.length,
        hasMore,
        nextOffset: hasMore ? offset + pageSize : null,
      };

      const isPublicFeedQuery =
        !currentUid && !flaggedOnly && !savedBy && !likedBy && !includeOwnAnonymous;
      res.setHeader(
        'Cache-Control',
        isPublicFeedQuery
          ? 'public, max-age=30, stale-while-revalidate=90'
          : 'private, max-age=10, stale-while-revalidate=30'
      );
      return res.status(200).json(payload);
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Failed to list posts' });
    }
  });

  // 4. POST /api/posts/upload & /api/posts/upload-url — Upload attachment to Cloudflare R2
  const handleR2Upload = async (req: express.Request, res: express.Response) => {
    try {
      const user = await verifyFirebaseJwtZeroFirestore(req);
      if (!user) {
        return res
          .status(401)
          .json({ success: false, code: 'NOT_AUTHENTICATED', error: 'Please sign in again' });
      }

      const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown');
      if (!checkWriteRateLimit(`upload:${user.uid}:${ip}`, 25, 60 * 60 * 1000)) {
        return res
          .status(429)
          .json({ success: false, error: 'Upload rate limit reached. Please wait before uploading more files.' });
      }

      const body = req.body || {};
      const postId = String(
        body.postId || req.headers['x-post-id'] || `post_${Date.now()}`
      )
        .trim()
        .replace(/[^a-zA-Z0-9_-]/g, '_');
      const rawName = String(body.fileName || body.name || 'resource.pdf').trim();
      const safeName = rawName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const mimeType = String(body.fileType || body.mimeType || body.type || 'application/pdf').trim();
      const dataBase64 = String(body.dataBase64 || '').trim();

      if (!dataBase64) {
        return res.status(400).json({
          success: false,
          code: 'MISSING_FILE_DATA',
          error: 'Missing file binary payload.',
        });
      }

      const lowerName = rawName.toLowerCase();
      const hasValidExt = [
        '.png',
        '.jpg',
        '.jpeg',
        '.webp',
        '.gif',
        '.pdf',
        '.docx',
        '.doc',
        '.pptx',
        '.ppt',
        '.txt',
      ].some((ext) => lowerName.endsWith(ext));

      if (!ALLOWED_MIME_TYPES.has(mimeType) && !hasValidExt) {
        return res.status(415).json({
          success: false,
          code: 'UNSUPPORTED_TYPE',
          error: 'Unsupported file type',
        });
      }

      // Canonical R2 key format: posts/{postId}/{random-id}-{safe-filename}
      const randId = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
      const r2Key = `posts/${postId}/${randId}-${safeName}`;

      const cleanBase64 = dataBase64.includes(',')
        ? dataBase64.slice(dataBase64.indexOf(',') + 1)
        : dataBase64;
      const buffer = Buffer.from(cleanBase64, 'base64');

      if (buffer.length === 0) {
        return res.status(400).json({ success: false, error: 'Uploaded file is empty (0 bytes).' });
      }
      if (buffer.length > MAX_UPLOAD_BYTES) {
        return res.status(413).json({
          success: false,
          code: 'FILE_TOO_LARGE',
          error: 'File too large',
        });
      }

      // 1. Save to local R2 mirror so preview works immediately
      const localPath = path.join(R2_LOCAL_DIR, r2Key);
      fs.mkdirSync(path.dirname(localPath), { recursive: true });
      fs.writeFileSync(localPath, buffer);

      // 2. If Cloudflare R2 S3 credentials are configured, upload directly to R2 bucket
      const r2AccountId = process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID || '';
      const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID || '';
      const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '';
      const r2BucketName = process.env.R2_BUCKET_NAME || 'boardly-commons-media';

      if (r2AccountId && r2AccessKeyId && r2SecretAccessKey) {
        try {
          const s3Mod = await import('@aws-sdk/client-s3');
          const s3 = new s3Mod.S3Client({
            region: 'auto',
            endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
            credentials: {
              accessKeyId: r2AccessKeyId,
              secretAccessKey: r2SecretAccessKey,
            },
          });
          await s3.send(
            new s3Mod.PutObjectCommand({
              Bucket: r2BucketName,
              Key: r2Key,
              Body: buffer,
              ContentType: mimeType,
              CacheControl: 'private, max-age=31536000',
            })
          );
        } catch (r2Err) {
          console.warn('[R2Upload] Remote R2 upload notice (served from local R2 mirror):', r2Err);
        }
      }

      const isImage =
        mimeType.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(rawName);
      const downloadUrl = `/api/posts/download?key=${encodeURIComponent(r2Key)}`;
      const serveUrl = isImage
        ? `/api/posts/file?key=${encodeURIComponent(r2Key)}`
        : downloadUrl;

      return res.status(200).json({
        success: true,
        key: r2Key,
        r2Key,
        url: serveUrl,
        downloadUrl,
        r2Url: `${R2_PUBLIC_BASE_URL}/${r2Key}`,
        name: rawName,
        size: buffer.length,
        type: mimeType,
      });
    } catch (err: any) {
      if (err?.message === 'POSTING_BANNED') {
        return res.status(403).json({
          success: false,
          error: 'Your account is restricted from uploading in Boardly Commons.',
        });
      }
      return res
        .status(500)
        .json({ success: false, error: err?.message || 'Upload failed, try again' });
    }
  };

  app.post('/api/posts/upload', handleR2Upload);
  app.post('/api/posts/upload-url', handleR2Upload);

  // 4b. DELETE /api/posts/upload — Rollback uploaded R2 objects if post publish fails
  app.delete('/api/posts/upload', async (req, res) => {
    try {
      const user = await verifyFirebaseJwtZeroFirestore(req);
      if (!user) {
        return res.status(401).json({ success: false, error: 'Please sign in again' });
      }
      const keys = Array.isArray(req.body?.keys)
        ? req.body.keys
            .map((k: any) => String(k || '').trim())
            .filter((k: string) => k.startsWith('posts/') && !k.includes('..'))
        : [];
      for (const k of keys) {
        const localPath = path.join(R2_LOCAL_DIR, k);
        if (fs.existsSync(localPath)) {
          fs.unlinkSync(localPath);
        }
      }
      return res.status(200).json({ success: true, deletedKeys: keys });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Rollback error' });
    }
  });

  // 5. GET /api/posts/moderation/queue — Admin Moderation Queue (Flagged Posts + Pending Reports)
  app.get('/api/posts/moderation/queue', async (req, res) => {
    try {
      const user = await verifyFirebaseJwtZeroFirestore(req);
      if (!user || (user.role !== 'superadmin' && user.role !== 'admin')) {
        return res.status(403).json({
          success: false,
          code: 'PERMISSION_DENIED',
          permission: 'content.delete',
          error: 'Admin access required.',
        });
      }
      const store = loadD1Store() as any;
      const canSeePrivateIdentity = user.role === 'superadmin';
      const flaggedPosts = store.posts
        .filter((p: any) => p.report_count >= 1 || p.is_hidden === 1)
        .map((p: any) => {
          const formatted = rowToCommonsPost(p, user.uid) as any;
          if (!canSeePrivateIdentity) {
            delete formatted.authorUid;
            delete formatted.realAuthorUid;
            delete formatted.authorEmail;
            return formatted;
          }
          return {
            ...formatted,
            realAuthorUid: p.real_author_uid,
          };
        });
      const pendingReports = (store.reports || [])
        .filter((r: any) => r.status === 'pending')
        .map((r: any) => {
          if (!canSeePrivateIdentity) {
            const { reporter_uid, ...safeReport } = r;
            return safeReport;
          }
          return r;
        });

      return res.status(200).json({
        success: true,
        flaggedPosts,
        reports: pendingReports,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Moderation load error' });
    }
  });

  // 6. POST /api/posts/moderation/ban — Ban Author in D1 `user_roles`
  app.post('/api/posts/moderation/ban', async (req, res) => {
    try {
      const user = await verifyFirebaseJwtZeroFirestore(req);
      if (!user) {
        return res.status(401).json({ success: false, error: 'Authentication required.' });
      }
      const targetUid = String(req.body?.targetUid || req.body?.authorUid || '').trim();
      const postId = String(req.body?.postId || '').trim();
      const store = loadD1Store() as any;

      let resolvedUid = targetUid;
      if (!resolvedUid && postId) {
        const p = store.posts.find((row: any) => row.id === postId);
        resolvedUid = p?.real_author_uid || p?.author_uid || '';
      }

      if (user.role !== 'superadmin') {
        const nowMs = Date.now();
        const grant = (store.accessGrants || []).find(
          (g: any) =>
            g.adminUid === user.uid &&
            g.permission === 'users.suspend' &&
            !g.revokedAt &&
            !g.usedAt &&
            (g.expiresAt === null || Number(g.expiresAt) > nowMs) &&
            (!g.targetId || !resolvedUid || g.targetId === resolvedUid)
        );
        if (!grant) {
          return res.status(403).json({
            success: false,
            code: 'PERMISSION_DENIED',
            permission: 'users.suspend',
            error: 'Permission denied: users.suspend is required to ban users.',
          });
        }
        if (grant.duration === 'once') {
          grant.usedAt = nowMs;
        }
      }
      if (!resolvedUid) {
        return res.status(400).json({ success: false, error: 'Author UID could not be determined.' });
      }

      const existingRole = store.userRoles.find((r) => r.uid === resolvedUid);
      if (existingRole) {
        existingRole.is_posting_banned = 1;
        existingRole.updated_at = Date.now();
      } else {
        store.userRoles.push({
          uid: resolvedUid,
          email: '',
          role: 'student',
          custom_role: null,
          is_posting_banned: 1,
          updated_at: Date.now(),
        });
      }
      saveD1Store(store);

      return res.status(200).json({
        success: true,
        bannedUid: resolvedUid,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Failed to ban user' });
    }
  });

  // 7. POST /api/posts — Create Post in D1
  app.post('/api/posts', async (req, res) => {
    try {
      const user = await verifyFirebaseJwtZeroFirestore(req);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Please sign in to publish a post in Boardly Commons.',
        });
      }

      if (
        user.role !== 'superadmin' &&
        !checkWriteRateLimit(`post:${user.uid}`, 10, 24 * 60 * 60 * 1000)
      ) {
        return res.status(429).json({
          success: false,
          error: 'You have reached the daily limit of 10 posts in 24 hours.',
        });
      }

      const body = req.body || {};
      const title = String(body.title || '').trim();
      const description = String(body.description || body.body || '').trim();
      if (!title) {
        return res.status(400).json({ success: false, error: 'Post title is required.' });
      }

      const id = String(body.id || `post_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`);
      const slug = buildSlug(id, title);
      const isAnon = Boolean(body.isAnonymous);
      const now = Date.now();
      const files = Array.isArray(body.files) ? body.files : [];
      const tags = Array.isArray(body.tags) ? body.tags : [];

      const newRow: D1PostRow = {
        id,
        slug,
        type: String(body.type || 'notes'),
        title,
        description,
        subject: String(body.subject || 'General'),
        chapter: String(body.chapter || 'General'),
        target: String(body.target || 'General'),
        class_level: String(body.classLevel || '11').replace(/^Class\s+/i, ''),
        board: String(body.board || 'Federal'),
        format: files.length > 0 ? 'pdf' : 'text',
        tags_json: JSON.stringify(tags),
        files_json: JSON.stringify(files),
        is_anonymous: isAnon ? 1 : 0,
        anonymous_alias: 'Anonymous Student',
        author_uid: isAnon ? null : user.uid,
        real_author_uid: user.uid,
        author_name: isAnon
          ? 'Anonymous Student'
          : String(body.authorName || user.name || 'Student'),
        author_avatar: isAnon
          ? null
          : sanitizeStoreAvatarId(body.authorEquippedAvatar, body.authorAvatar),
        author_frame: isAnon ? null : body.authorFrame || null,
        author_equipped_avatar: isAnon
          ? null
          : sanitizeStoreAvatarId(body.authorEquippedAvatar, body.authorAvatar),
        author_photo_url: null,
        author_role: isAnon ? 'student' : String(body.authorRole || user.role || 'student'),
        author_custom_role: isAnon ? null : body.authorCustomRole || user.customRole || null,
        status: 'published',
        visibility: 'public',
        is_hidden: 0,
        is_pinned: user.role === 'superadmin' && body.isPinned ? 1 : 0,
        is_featured: 0,
        upvotes: 0,
        downvotes: 0,
        views: 1,
        comment_count: 0,
        save_count: 0,
        shares_count: 0,
        report_count: 0,
        created_at: now,
        updated_at: now,
      };

      const store = loadD1Store();
      const maxExistingCreated = store.posts.reduce(
        (max, p) => Math.max(max, Number(p.created_at || 0)),
        0
      );
      const safeCreatedAt = Math.max(now, maxExistingCreated + 1);
      newRow.created_at = safeCreatedAt;
      newRow.updated_at = safeCreatedAt;

      store.posts.unshift(newRow);

      // Automatically notify followers when a non-anonymous post is created (never on edit, never if anonymous)
      if (!isAnon && newRow.author_uid) {
        if (!Array.isArray(store.follows)) store.follows = [];
        if (!Array.isArray(store.notifications)) store.notifications = [];
        const followerUids = Array.from(
          new Set(
            store.follows
              .filter(
                (f) =>
                  f.following_uid === newRow.author_uid &&
                  f.follower_uid &&
                  f.follower_uid !== newRow.author_uid
              )
              .map((f) => f.follower_uid)
          )
        );
        const avatarVal = sanitizeStoreAvatarId(
          newRow.author_equipped_avatar,
          newRow.author_avatar
        );
        const snippet = String(newRow.description || '').trim().slice(0, 140);
        for (const followerUid of followerUids) {
          const notifId = `post_${newRow.id}_follower_${followerUid}`;
          if (!store.notifications.some((n) => n.id === notifId)) {
            store.notifications.unshift({
              id: notifId,
              user_id: followerUid,
              type: 'following_post',
              title: `${newRow.author_name} posted: ${newRow.title}`,
              message: snippet || `New ${newRow.type || 'post'} in ${newRow.subject || 'Commons'}`,
              link: null,
              read: 0,
              is_pinned: 0,
              author_id: newRow.author_uid,
              author_name: newRow.author_name,
              author_avatar: avatarVal,
              author_frame: newRow.author_frame || null,
              post_id: newRow.id,
              post_type: newRow.type || 'notes',
              created_at: safeCreatedAt,
              read_at: null,
            });
          }
        }
      }

      saveD1Store(store);

      return res.status(201).json({
        success: true,
        postId: id,
        post: rowToCommonsPost(newRow, user.uid),
      });
    } catch (err: any) {
      if (err?.message === 'POSTING_BANNED') {
        return res.status(403).json({
          success: false,
          error: 'Your account is restricted from publishing in Boardly Commons.',
        });
      }
      return res
        .status(500)
        .json({ success: false, error: err?.message || 'Failed to publish post.' });
    }
  });

  // 8. GET /api/posts/:slugOrId — Fetch single post by slug or ID
  app.get('/api/posts/:slugOrId', async (req, res) => {
    const slugOrId = String(req.params.slugOrId || '').trim();
    const postId = extractIdFromSlugOrId(slugOrId);
    const user = await verifyFirebaseJwtZeroFirestore(req).catch(() => null);

    const store = loadD1Store();
    const row = store.posts.find((p) => p.id === postId || p.slug === slugOrId || p.id === slugOrId);

    if (!row) {
      return res.status(404).json({ success: false, error: 'Post not found.' });
    }

    if (req.query.view === '1') {
      row.views = (row.views || 0) + 1;
      saveD1Store(store);
    }

    const liveAuthorsMap = resolveLiveAuthorsBatchSync(
      row.is_anonymous ? [] : [row.author_uid],
      store
    );
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    return res.status(200).json({
      success: true,
      post: rowToCommonsPost(row, user?.uid, liveAuthorsMap),
    });
  });

  // 9. PUT & PATCH /api/posts/:slugOrId — Edit post, toggle anonymity, hide/unhide, pin
  const handleUpdatePost = async (req: express.Request, res: express.Response) => {
    try {
      const user = await verifyFirebaseJwtZeroFirestore(req);
      if (!user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const slugOrId = String(req.params.slugOrId || '').trim();
      const postId = extractIdFromSlugOrId(slugOrId);
      const store = loadD1Store();
      const row = store.posts.find(
        (p) => p.id === postId || p.slug === slugOrId || p.id === slugOrId
      );

      if (!row) {
        return res.status(404).json({ success: false, error: 'Post not found.' });
      }

      const isOwner = row.real_author_uid === user.uid || row.author_uid === user.uid;
      const isMod = user.role === 'superadmin' || user.role === 'admin';
      if (!isOwner && !isMod) {
        return res.status(403).json({ success: false, code: 'PERMISSION_DENIED', permission: 'content.delete', error: 'Forbidden' });
      }

      const body = req.body || {};
      if (body.title !== undefined) {
        row.title = String(body.title).trim();
        row.slug = buildSlug(row.id, row.title);
      }
      if (body.description !== undefined) {
        row.description = String(body.description).trim();
      }
      if (body.subject !== undefined) {
        row.subject = String(body.subject).trim();
      }
      if (body.chapter !== undefined) {
        row.chapter = String(body.chapter).trim();
      }
      if (body.tags !== undefined && Array.isArray(body.tags)) {
        row.tags_json = JSON.stringify(body.tags);
      }
      if (body.isAnonymous !== undefined) {
        const nextAnon = Boolean(body.isAnonymous);
        row.is_anonymous = nextAnon ? 1 : 0;
        row.author_uid = nextAnon ? null : row.real_author_uid;
        if (nextAnon) {
          row.author_name = 'Anonymous Student';
          row.author_avatar = null;
          row.author_frame = null;
          row.author_equipped_avatar = null;
          row.author_photo_url = null;
        } else if (body.authorName) {
          row.author_name = String(body.authorName);
          row.author_avatar =
            sanitizeStoreAvatarId(body.authorEquippedAvatar, body.authorAvatar) ??
            row.author_avatar;
          row.author_frame = body.authorFrame || row.author_frame;
          row.author_equipped_avatar =
            sanitizeStoreAvatarId(body.authorEquippedAvatar, body.authorAvatar) ??
            row.author_equipped_avatar;
          row.author_photo_url = null;
        }
      }
      if (body.isHidden !== undefined && isMod) {
        row.is_hidden = body.isHidden ? 1 : 0;
      }
      if (body.isPinned !== undefined && user.role === 'superadmin') {
        row.is_pinned = body.isPinned ? 1 : 0;
      }

      row.updated_at = Date.now();
      saveD1Store(store);

      return res.status(200).json({
        success: true,
        post: rowToCommonsPost(row, user.uid),
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Update failed' });
    }
  };

  app.put('/api/posts/:slugOrId', handleUpdatePost);
  app.patch('/api/posts/:slugOrId', handleUpdatePost);

  // 10. DELETE /api/posts/:slugOrId — Delete post and associated records
  app.delete('/api/posts/:slugOrId', async (req, res) => {
    try {
      const user = await verifyFirebaseJwtZeroFirestore(req);
      if (!user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const slugOrId = String(req.params.slugOrId || '').trim();
      const postId = extractIdFromSlugOrId(slugOrId);
      const store = loadD1Store();
      const idx = store.posts.findIndex(
        (p) => p.id === postId || p.slug === slugOrId || p.id === slugOrId
      );

      if (idx === -1) {
        return res.status(404).json({ success: false, error: 'Post not found.' });
      }

      const row = store.posts[idx];
      const isOwner = row.real_author_uid === user.uid || row.author_uid === user.uid;
      if (!isOwner && user.role !== 'superadmin' && user.role !== 'admin') {
        return res.status(403).json({ success: false, code: 'PERMISSION_DENIED', permission: 'content.delete', error: 'Forbidden' });
      }

      const deletedId = row.id;
      store.posts.splice(idx, 1);
      store.likes = store.likes.filter((l) => l.post_id !== deletedId);
      store.saves = store.saves.filter((s) => s.post_id !== deletedId);
      store.comments = store.comments.filter((c) => c.post_id !== deletedId);
      store.reports = store.reports.filter((r) => r.post_id !== deletedId);
      saveD1Store(store);

      return res.status(200).json({ success: true, deletedId });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Delete failed' });
    }
  });

  // 11. GET /api/posts/:slugOrId/status — Check if current user liked/saved post
  app.get('/api/posts/:slugOrId/status', async (req, res) => {
    const slugOrId = String(req.params.slugOrId || '').trim();
    const postId = extractIdFromSlugOrId(slugOrId);
    const user = await verifyFirebaseJwtZeroFirestore(req).catch(() => null);
    const uid = user?.uid || String(req.query.userId || '').trim();

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    if (!uid) {
      return res.status(200).json({ success: true, voted: false, saved: false });
    }

    const store = loadD1Store();
    const post = store.posts.find(
      (p) => p.id === postId || p.slug === slugOrId || p.id === slugOrId
    );
    const canonicalPostId = post?.id || postId;
    const voted = store.likes.some((l) => l.post_id === canonicalPostId && l.user_uid === uid);
    const saved = store.saves.some((s) => s.post_id === canonicalPostId && s.user_uid === uid);

    return res.status(200).json({ success: true, voted, saved });
  });

  // 12. POST /api/posts/:slugOrId/like — Toggle Like / Upvote
  app.post('/api/posts/:slugOrId/like', async (req, res) => {
    try {
      const user = await verifyFirebaseJwtZeroFirestore(req);
      if (!user) {
        return res.status(401).json({ success: false, error: 'Please sign in to like posts.' });
      }

      const slugOrId = String(req.params.slugOrId || '').trim();
      const postId = extractIdFromSlugOrId(slugOrId);
      const store = loadD1Store();
      const post = store.posts.find(
        (p) => p.id === postId || p.slug === slugOrId || p.id === slugOrId
      );

      if (!post) {
        return res.status(404).json({ success: false, error: 'Post not found.' });
      }

      const existingLikesForUser = store.likes.filter(
        (l) => l.post_id === post.id && l.user_uid === user.uid
      );

      let voted = false;
      if (existingLikesForUser.length > 0) {
        store.likes = store.likes.filter(
          (l) => !(l.post_id === post.id && l.user_uid === user.uid)
        );
        const remainingLikesCount = store.likes.filter((l) => l.post_id === post.id).length;
        post.upvotes = Math.max(remainingLikesCount, Math.max(0, (post.upvotes || 0) - 1));
        voted = false;
        // Clean up like notification if unliked
        const likeNotifId = `like_${post.id}_${user.uid}`;
        store.notifications = store.notifications.filter((n) => n.id !== likeNotifId);
      } else {
        const likeNow = Date.now();
        store.likes.push({
          post_id: post.id,
          user_uid: user.uid,
          created_at: likeNow,
        });
        const totalLikesCount = store.likes.filter((l) => l.post_id === post.id).length;
        post.upvotes = Math.max(totalLikesCount, (post.upvotes || 0) + 1);
        voted = true;

        // Notify post author if not liking own post
        if (post.author_uid && post.author_uid !== user.uid) {
          const likeNotifId = `like_${post.id}_${user.uid}`;
          const existingLikeNotif = store.notifications.find((n) => n.id === likeNotifId);
          if (!existingLikeNotif) {
            const likerName = String(user.name || 'A student');
            store.notifications.unshift({
              id: likeNotifId,
              user_id: post.author_uid,
              type: 'like',
              title: `${likerName} liked your post`,
              message: post.title ? `Liked "${post.title.slice(0, 80)}"` : 'Liked your post in Commons.',
              link: null,
              read: 0,
              is_pinned: 0,
              author_id: user.uid,
              author_name: likerName,
              author_avatar: null,
              author_frame: null,
              post_id: post.id,
              post_type: post.type || 'notes',
              created_at: likeNow,
              read_at: null,
            });
          }
        }
      }

      saveD1Store(store);
      return res.status(200).json({
        success: true,
        voted,
        newCount: post.upvotes,
        upvoted: voted,
        upvotesCount: post.upvotes,
        likesCount: post.upvotes,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Failed to toggle like' });
    }
  });

  // 13. POST /api/posts/:slugOrId/save — Toggle Save / Bookmark
  app.post('/api/posts/:slugOrId/save', async (req, res) => {
    try {
      const user = await verifyFirebaseJwtZeroFirestore(req);
      if (!user) {
        return res.status(401).json({ success: false, error: 'Please sign in to save posts.' });
      }

      const slugOrId = String(req.params.slugOrId || '').trim();
      const postId = extractIdFromSlugOrId(slugOrId);
      const store = loadD1Store();
      const post = store.posts.find(
        (p) => p.id === postId || p.slug === slugOrId || p.id === slugOrId
      );

      if (!post) {
        return res.status(404).json({ success: false, error: 'Post not found.' });
      }

      const existingIdx = store.saves.findIndex(
        (s) => s.post_id === post.id && s.user_uid === user.uid
      );

      let saved = false;
      if (existingIdx !== -1) {
        store.saves.splice(existingIdx, 1);
        post.save_count = Math.max(0, (post.save_count || 0) - 1);
        saved = false;
      } else {
        store.saves.push({
          post_id: post.id,
          user_uid: user.uid,
          created_at: Date.now(),
        });
        post.save_count = (post.save_count || 0) + 1;
        saved = true;
      }

      saveD1Store(store);
      return res.status(200).json({ success: true, saved });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Failed to toggle save' });
    }
  });

  // 14. GET & POST & DELETE /api/posts/:slugOrId/comments
  app.get('/api/posts/:slugOrId/comments', (req, res) => {
    const slugOrId = String(req.params.slugOrId || '').trim();
    const postId = extractIdFromSlugOrId(slugOrId);
    const store = loadD1Store();

    const matchingComments = store.comments
      .filter((c) => c.post_id === postId || c.post_id === slugOrId)
      .sort((a, b) => a.created_at - b.created_at);

    // ONE batched lookup for all non-anonymous comment authors on this post
    const liveAuthors = resolveLiveAuthorsBatchSync(
      matchingComments.map((c) => (c.is_anonymous ? null : c.author_uid)),
      store
    );

    const comments = matchingComments.map((c) => {
      const isAnon = Boolean(c.is_anonymous);
      const authorUid = isAnon ? null : c.author_uid;
      const liveAuthor = !isAnon && authorUid ? liveAuthors.get(authorUid) : undefined;
      const isDeleted = Boolean(liveAuthor?.isDeleted);

      const resolvedName = isAnon
        ? 'Anonymous Student'
        : isDeleted
        ? c.author_name || 'Student'
        : liveAuthor?.displayName || liveAuthor?.username || c.author_name || 'Student';

      const resolvedAvatar = isAnon
        ? null
        : isDeleted
        ? sanitizeStoreAvatarId(c.author_equipped_avatar, c.author_avatar)
        : sanitizeStoreAvatarId(liveAuthor?.avatar, c.author_equipped_avatar, c.author_avatar);

      const resolvedFrame = isAnon
        ? null
        : !isDeleted && liveAuthor?.frame !== undefined && liveAuthor.frame !== null
        ? liveAuthor.frame
        : c.author_frame;

      const resolvedRole = isAnon
        ? 'student'
        : !isDeleted && liveAuthor?.role
        ? liveAuthor.role
        : c.author_role;

      const resolvedCustomRole = isAnon
        ? null
        : !isDeleted && liveAuthor?.customRole !== undefined && liveAuthor.customRole !== null
        ? liveAuthor.customRole
        : c.author_custom_role;

      return {
        id: c.id,
        postId: c.post_id,
        text: c.text,
        isAnonymous: isAnon,
        authorUid,
        authorName: resolvedName,
        authorUsername: isAnon || isDeleted ? null : liveAuthor?.username || null,
        authorAvatar: resolvedAvatar,
        authorFrame: resolvedFrame,
        authorEquippedAvatar: resolvedAvatar,
        authorPhotoURL: null,
        authorRole: resolvedRole,
        authorCustomRole: resolvedCustomRole,
        authorProBadge: isAnon || isDeleted ? null : liveAuthor?.proBadge ?? null,
        proBadge: isAnon || isDeleted ? null : liveAuthor?.proBadge ?? null,
        createdAt: new Date(c.created_at).toISOString(),
      };
    });

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    return res.status(200).json({ success: true, comments });
  });

  app.post('/api/posts/:slugOrId/comments', async (req, res) => {
    try {
      const user = await verifyFirebaseJwtZeroFirestore(req);
      if (!user) {
        return res.status(401).json({ success: false, error: 'Please sign in to comment.' });
      }

      const slugOrId = String(req.params.slugOrId || '').trim();
      const postId = extractIdFromSlugOrId(slugOrId);
      const store = loadD1Store();
      const post = store.posts.find(
        (p) => p.id === postId || p.slug === slugOrId || p.id === slugOrId
      );

      if (!post) {
        return res.status(404).json({ success: false, error: 'Post not found.' });
      }

      const body = req.body || {};
      const text = String(body.text || '').trim();
      if (!text) {
        return res.status(400).json({ success: false, error: 'Comment text is required.' });
      }

      const isAnon = Boolean(body.isAnonymous);
      const now = Date.now();
      const id = `cmt_${now}_${crypto.randomUUID().slice(0, 8)}`;

      const row: D1CommentRow = {
        id,
        post_id: post.id,
        text,
        is_anonymous: isAnon ? 1 : 0,
        author_uid: isAnon ? null : user.uid,
        real_author_uid: user.uid,
        author_name: isAnon
          ? 'Anonymous Student'
          : String(body.authorName || user.name || 'Student'),
        author_avatar: isAnon
          ? null
          : sanitizeStoreAvatarId(body.authorEquippedAvatar, body.authorAvatar),
        author_frame: isAnon ? null : body.authorFrame || null,
        author_equipped_avatar: isAnon
          ? null
          : sanitizeStoreAvatarId(body.authorEquippedAvatar, body.authorAvatar),
        author_photo_url: null,
        author_role: isAnon ? 'student' : user.role,
        author_custom_role: isAnon ? null : user.customRole,
        created_at: now,
      };

      store.comments.push(row);
      post.comment_count = (post.comment_count || 0) + 1;

      // Notify post author if not commenting on own post
      if (post.author_uid && post.author_uid !== user.uid) {
        const cmtNotifId = `comment_${id}_${post.author_uid}`;
        const cmtAuthorName = isAnon ? 'A student' : String(body.authorName || user.name || 'A student');
        store.notifications.unshift({
          id: cmtNotifId,
          user_id: post.author_uid,
          type: 'comment',
          title: `${cmtAuthorName} commented on your post`,
          message: text.slice(0, 120),
          link: null,
          read: 0,
          is_pinned: 0,
          author_id: isAnon ? null : user.uid,
          author_name: cmtAuthorName,
          author_avatar: isAnon ? null : row.author_avatar,
          author_frame: isAnon ? null : row.author_frame,
          post_id: post.id,
          post_type: post.type || 'notes',
          created_at: now,
          read_at: null,
        });
      }

      saveD1Store(store);

      return res.status(201).json({
        success: true,
        comment: {
          id,
          postId: post.id,
          text,
          isAnonymous: isAnon,
          authorUid: row.author_uid,
          authorName: row.author_name,
          authorAvatar: row.author_avatar,
          authorFrame: row.author_frame,
          authorEquippedAvatar: row.author_equipped_avatar,
          authorPhotoURL: null,
          createdAt: new Date(now).toISOString(),
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Comment failed' });
    }
  });

  app.delete('/api/posts/:slugOrId/comments/:commentId', async (req, res) => {
    try {
      const user = await verifyFirebaseJwtZeroFirestore(req);
      if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

      const commentId = String(req.params.commentId || '').trim();
      const store = loadD1Store();
      const idx = store.comments.findIndex((c) => c.id === commentId);
      if (idx === -1) return res.status(404).json({ success: false, error: 'Comment not found' });

      const cmt = store.comments[idx];
      if (cmt.real_author_uid !== user.uid && user.role !== 'superadmin' && user.role !== 'admin') {
        return res.status(403).json({ success: false, code: 'PERMISSION_DENIED', permission: 'content.delete', error: 'Forbidden' });
      }

      const post = store.posts.find((p) => p.id === cmt.post_id);
      if (post) {
        post.comment_count = Math.max(0, (post.comment_count || 0) - 1);
      }
      store.comments.splice(idx, 1);
      saveD1Store(store);

      return res.status(200).json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Delete comment failed' });
    }
  });

  // 15. POST /api/posts/:slugOrId/report — Report Post
  app.post('/api/posts/:slugOrId/report', async (req, res) => {
    try {
      const user = await verifyFirebaseJwtZeroFirestore(req);
      if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

      const slugOrId = String(req.params.slugOrId || '').trim();
      const postId = extractIdFromSlugOrId(slugOrId);
      const store = loadD1Store();
      const post = store.posts.find(
        (p) => p.id === postId || p.slug === slugOrId || p.id === slugOrId
      );

      if (!post) return res.status(404).json({ success: false, error: 'Post not found' });

      const reason = String(req.body?.reason || 'other');
      const details = String(req.body?.details || '').trim();
      const id = `rep_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

      store.reports.push({
        id,
        post_id: post.id,
        reporter_uid: user.uid,
        reason,
        details,
        status: 'pending',
        created_at: Date.now(),
      });

      post.report_count = (post.report_count || 0) + 1;
      if (post.report_count >= 3) {
        post.is_hidden = 1;
      }
      saveD1Store(store);

      return res.status(201).json({ success: true, reportId: id });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Report failed' });
    }
  });

  // ============================================================================
  // PASSWORD RESET FALLBACK ENDPOINT (Fixes Firebase `auth/error-code:-26`)
  // ============================================================================
  app.post('/api/auth/password-reset', async (req, res) => {
    try {
      const email = String(req.body?.email || '').trim().toLowerCase();
      if (!email || !email.includes('@')) {
        return res.status(400).json({
          success: false,
          code: 'auth/invalid-email',
          error: 'Please enter a valid email address.',
        });
      }

      // Check if this email was permanently deleted by an admin
      const deletedRegistry = loadDeletedAccountsRegistry();
      const wasAdminDeleted = deletedRegistry.some((d) => d.email.toLowerCase() === email);

      const apiKey = getFirebaseWebApiKey();
      if (!apiKey) {
        return res.status(500).json({
          success: false,
          code: 'auth/internal-error',
          error: 'Firebase API key is not configured on the server.',
        });
      }

      // Call Google Identity Toolkit directly WITHOUT restrictive continueUrl
      // (continueUrl / custom authDomain mismatch is what triggers auth/error-code:-26)
      const resp = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requestType: 'PASSWORD_RESET',
            email,
          }),
        }
      );

      const data = (await resp.json()) as any;
      if (!resp.ok) {
        const rawMessage = String(data?.error?.message || 'UNKNOWN_ERROR');
        if (rawMessage.includes('EMAIL_NOT_FOUND') || wasAdminDeleted) {
          return res.status(404).json({
            success: false,
            code: 'auth/user-not-found',
            error:
              'No active account was found with this email address. If your account was deleted, you can sign up again to create a new account.',
          });
        }
        if (rawMessage.includes('INVALID_EMAIL')) {
          return res.status(400).json({
            success: false,
            code: 'auth/invalid-email',
            error: 'Please enter a valid email address.',
          });
        }
        if (rawMessage.includes('TOO_MANY_ATTEMPTS_TRY_LATER')) {
          return res.status(429).json({
            success: false,
            code: 'auth/too-many-requests',
            error: 'Too many password reset requests. Please wait a few minutes and try again.',
          });
        }
        if (rawMessage.includes('-26') || rawMessage.includes('UNAUTHORIZED_DOMAIN')) {
          return res.status(400).json({
            success: false,
            code: 'auth/error-code:-26',
            error:
              'Password reset domain configuration error (auth/error-code:-26). Ensure boardly.cfd and auth.boardly.cfd are added under Firebase Console > Authentication > Settings > Authorized domains.',
          });
        }

        return res.status(400).json({
          success: false,
          code: `auth/${rawMessage.toLowerCase()}`,
          error: `Could not send password reset email (${rawMessage}).`,
        });
      }

      return res.status(200).json({
        success: true,
        email: data.email || email,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        code: 'auth/network-request-failed',
        error: err?.message || 'Failed to send password reset email.',
      });
    }
  });

  // ============================================================================
  // COMPLETE & CONSISTENT ADMIN USER DELETION (Auth + Firestore + D1)
  // ============================================================================
  const handleAdminDeleteUser = async (req: Request, res: Response) => {
    try {
      const adminUser = await verifyFirebaseJwtZeroFirestore(req);
      if (!adminUser) {
        return res.status(401).json({
          success: false,
          code: 'UNAUTHENTICATED',
          error: 'Authentication required.',
        });
      }

      const targetUid = String(
        req.params?.id || req.params?.uid || req.body?.targetUid || req.body?.studentId || ''
      ).trim();
      const targetEmail = String(req.body?.targetEmail || req.body?.studentEmail || '')
        .trim()
        .toLowerCase();

      const d1StoreCheck = loadD1Store() as any;
      if (adminUser.role !== 'superadmin') {
        const nowMs = Date.now();
        const grant = (d1StoreCheck.accessGrants || []).find(
          (g: any) =>
            g.adminUid === adminUser.uid &&
            g.permission === 'users.delete' &&
            !g.revokedAt &&
            !g.usedAt &&
            (g.expiresAt === null || Number(g.expiresAt) > nowMs) &&
            (!g.targetId || g.targetId === targetUid)
        );
        if (!grant) {
          return res.status(403).json({
            success: false,
            code: 'PERMISSION_DENIED',
            permission: 'users.delete',
            error: 'Forbidden: Only superadmins or admins with an approved users.delete grant can permanently delete user accounts.',
          });
        }
        if (grant.duration === 'once') {
          grant.usedAt = nowMs;
          saveD1Store(d1StoreCheck);
        }
      }

      if (!targetUid && !targetEmail) {
        return res.status(400).json({
          success: false,
          error: 'Missing targetUid or targetEmail for permanent deletion.',
        });
      }

      if (SUPERADMIN_UIDS.has(targetUid) || (targetEmail && SUPERADMIN_EMAILS.has(targetEmail))) {
        return res.status(403).json({
          success: false,
          code: 'SUPERADMIN_PROTECTED',
          error: 'Cannot delete a protected Super Admin account.',
        });
      }

      const targetRoleRow = (d1StoreCheck.userRoles || []).find(
        (r: any) => r.uid === targetUid || (targetEmail && String(r.email || '').toLowerCase() === targetEmail)
      );
      if (targetRoleRow && (targetRoleRow.role === 'super_admin' || targetRoleRow.role === 'superadmin')) {
        const remainingSupers = (d1StoreCheck.userRoles || []).filter(
          (r: any) =>
            r.uid !== targetUid &&
            (r.role === 'super_admin' || r.role === 'superadmin' || SUPERADMIN_UIDS.has(r.uid))
        );
        if (remainingSupers.length === 0) {
          return res.status(403).json({
            success: false,
            code: 'LAST_SUPERADMIN_PROTECTED',
            error: 'Cannot delete the last remaining Super Admin account.',
          });
        }
      }

      const steps: Record<string, { ok: boolean; detail: string }> = {};

      // STEP 1: Delete from Firebase Authentication via Google Identity Toolkit Admin API
      let firebaseAuthDeleted = false;
      let firebaseAuthError: string | null = null;
      const accessToken = options?.getGoogleAccessToken
        ? await options.getGoogleAccessToken().catch(() => null)
        : null;

      if (accessToken && targetUid) {
        try {
          const authDelResp = await fetch(
            `https://identitytoolkit.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/accounts:delete`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ localId: targetUid }),
            }
          );

          if (authDelResp.ok) {
            firebaseAuthDeleted = true;
            steps.firebaseAuth = {
              ok: true,
              detail: `Deleted user ${targetUid} from Firebase Authentication.`,
            };
          } else {
            const errJson = (await authDelResp.json().catch(() => ({}))) as any;
            const msg = String(errJson?.error?.message || authDelResp.statusText);
            if (msg.includes('USER_NOT_FOUND')) {
              firebaseAuthDeleted = true;
              steps.firebaseAuth = {
                ok: true,
                detail: 'User was already absent from Firebase Authentication.',
              };
            } else {
              firebaseAuthError = `Firebase Auth Admin API returned: ${msg}`;
              steps.firebaseAuth = { ok: false, detail: firebaseAuthError };
            }
          }
        } catch (e: any) {
          firebaseAuthError = e?.message || 'Failed calling Firebase Auth Admin API';
          steps.firebaseAuth = { ok: false, detail: firebaseAuthError };
        }
      } else {
        // Check if the email actually exists in Firebase Auth via createAuthUri
        const apiKey = getFirebaseWebApiKey();
        let existsInFirebaseAuth = false;
        if (apiKey && targetEmail) {
          try {
            const checkResp = await fetch(
              `https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${apiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  identifier: targetEmail,
                  continueUri: 'https://boardly.cfd/login',
                }),
              }
            );
            const checkData = (await checkResp.json().catch(() => ({}))) as any;
            existsInFirebaseAuth = Boolean(checkData?.registered);
          } catch {
            // Ignore API probe failure
          }
        }

        if (!existsInFirebaseAuth) {
          firebaseAuthDeleted = true;
          steps.firebaseAuth = {
            ok: true,
            detail: 'Verified email is not registered in Firebase Authentication.',
          };
        } else {
          firebaseAuthError =
            'FIREBASE_SERVICE_ACCOUNT_KEY / GOOGLE_APPLICATION_CREDENTIALS is not set on the server, so Firebase Authentication could not delete the Auth credential record directly.';
          steps.firebaseAuth = {
            ok: false,
            detail: firebaseAuthError,
          };
        }
      }

      // STEP 2: Delete user's posts, comments, likes, saves, and roles in Cloudflare D1
      const store = loadD1Store();
      const beforePosts = store.posts.length;
      store.posts = store.posts.filter(
        (p) => p.real_author_uid !== targetUid && p.author_uid !== targetUid
      );
      store.likes = store.likes.filter((l) => l.user_uid !== targetUid);
      store.saves = store.saves.filter((s) => s.user_uid !== targetUid);
      store.comments = store.comments.filter((c) => c.real_author_uid !== targetUid);
      store.userRoles = store.userRoles.filter(
        (r) => r.uid !== targetUid && (!targetEmail || r.email.toLowerCase() !== targetEmail)
      );
      saveD1Store(store);
      steps.cloudflareD1 = {
        ok: true,
        detail: `Removed ${beforePosts - store.posts.length} post(s) and all likes/saves/comments/roles from Cloudflare D1.`,
      };

      // STEP 3: Record in Deleted Accounts Registry
      const registry = loadDeletedAccountsRegistry().filter(
        (e) => e.uid !== targetUid && (!targetEmail || e.email !== targetEmail)
      );
      registry.push({
        uid: targetUid,
        email: targetEmail,
        deletedAt: new Date().toISOString(),
        deletedBy: adminUser.email || adminUser.uid,
        firebaseAuthDeleted,
      });
      saveDeletedAccountsRegistry(registry);

      return res.status(200).json({
        success: true,
        firebaseAuthDeleted,
        firebaseAuthWarning: firebaseAuthError,
        steps,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err?.message || 'Failed to delete user account.',
      });
    }
  };
  app.post('/api/admin/users/delete', handleAdminDeleteUser);
  app.delete('/api/admin/users/:id', handleAdminDeleteUser);

  // Check if an email belongs to an admin-deleted or orphan account
  app.get('/api/auth/check-account-status', async (req, res) => {
    const email = String(req.query.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, error: 'Missing email query parameter.' });
    }
    const registry = loadDeletedAccountsRegistry();
    const deletedEntry = registry.find((d) => d.email.toLowerCase() === email);
    return res.status(200).json({
      success: true,
      email,
      wasDeletedByAdmin: Boolean(deletedEntry),
      deletedEntry: deletedEntry || null,
    });
  });

  // ============================================================================
  // SHARED ADMIN STUDENT SEARCH ENDPOINT (/api/admin/users/search)
  // Used by both /admin/kobans (Wallets tab) and /admin/users.
  // Enforces admin/superadmin role server-side from verified Firebase ID token.
  // ============================================================================
  const unwrapFirestoreField = (val: any): any => {
    if (!val || typeof val !== 'object') return undefined;
    if ('stringValue' in val) return String(val.stringValue);
    if ('timestampValue' in val) return String(val.timestampValue);
    if ('integerValue' in val) return Number(val.integerValue);
    if ('doubleValue' in val) return Number(val.doubleValue);
    if ('booleanValue' in val) return Boolean(val.booleanValue);
    if ('nullValue' in val) return null;
    return undefined;
  };

  const parseFirestoreRestDoc = (docObj: any): { id: string; data: Record<string, any> } | null => {
    if (!docObj || typeof docObj.name !== 'string') return null;
    const id = docObj.name.split('/').pop() || '';
    if (!id) return null;
    const fields = docObj.fields || {};
    const data: Record<string, any> = {};
    for (const [k, v] of Object.entries(fields)) {
      data[k] = unwrapFirestoreField(v);
    }
    return { id, data };
  };

  const fetchFirestoreCollectionRest = async (
    collectionName: string,
    bearerHeader: string,
    pageSize = 500
  ): Promise<Array<{ id: string; data: Record<string, any> }>> => {
    const dbIds = Array.from(new Set([FIRESTORE_DATABASE_ID, '(default)'].filter(Boolean)));
    for (const dbId of dbIds) {
      try {
        const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/${encodeURIComponent(
          dbId
        )}/documents/${encodeURIComponent(collectionName)}?pageSize=${pageSize}`;
        const resp = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: bearerHeader,
            Accept: 'application/json',
          },
        });
        if (resp.ok) {
          const json = (await resp.json().catch(() => ({}))) as { documents?: any[] };
          const docs = Array.isArray(json.documents) ? json.documents : [];
          const parsed = docs
            .map(parseFirestoreRestDoc)
            .filter((d): d is { id: string; data: Record<string, any> } => Boolean(d));
          if (parsed.length > 0 || dbId === FIRESTORE_DATABASE_ID) {
            return parsed;
          }
        }
      } catch {
        // Continue to fallback database id
      }
    }
    return [];
  };

  const verifyFirestoreUserIsAdminRest = async (
    uid: string,
    bearerHeader: string
  ): Promise<boolean> => {
    const dbIds = Array.from(new Set([FIRESTORE_DATABASE_ID, '(default)'].filter(Boolean)));
    for (const dbId of dbIds) {
      try {
        const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/${encodeURIComponent(
          dbId
        )}/documents/users/${encodeURIComponent(uid)}`;
        const resp = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: bearerHeader,
            Accept: 'application/json',
          },
        });
        if (resp.ok) {
          const docJson = await resp.json().catch(() => null);
          const parsed = parseFirestoreRestDoc(docJson);
          const role = String(parsed?.data?.role || '').toLowerCase().trim();
          if (role === 'admin' || role === 'superadmin') {
            return true;
          }
        }
      } catch {
        // Ignore REST lookup error
      }
    }
    return false;
  };

  const handleAdminKobansUserSearch = async (req: express.Request, res: express.Response) => {
    try {
      const authHeader = String(req.headers.authorization || '');
      if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          code: 'UNAUTHORIZED',
          error: 'Authentication token required (401).',
          users: [],
        });
      }

      const adminUser = await verifyFirebaseJwtZeroFirestore(req);
      if (!adminUser) {
        return res.status(401).json({
          success: false,
          code: 'INVALID_TOKEN',
          error: 'Invalid or expired session token (401).',
          users: [],
        });
      }

      let isAuthorizedAdmin = adminUser.role === 'superadmin';
      if (!isAuthorizedAdmin) {
        isAuthorizedAdmin = await verifyFirestoreUserIsAdminRest(adminUser.uid, authHeader);
      }

      if (!isAuthorizedAdmin) {
        return res.status(403).json({
          success: false,
          code: 'FORBIDDEN',
          error: 'Forbidden: Admin or Superadmin role required (403).',
          users: [],
        });
      }

      const rawQ = String(req.query.q ?? req.query.search ?? '').trim();
      const qNorm = rawQ.toLowerCase().replace(/\s+/g, ' ');
      const qNoSpaces = rawQ.toLowerCase().replace(/\s+/g, '');
      const qHandle = qNoSpaces.replace(/^@+/, '');
      const qShortId = qNoSpaces.replace(/^#/, '');
      const limitCount = Math.min(50, Math.max(1, Number(req.query.limit || 10)));
      const offsetCount = Math.max(0, Number(req.query.offset || 0));

      if (qNoSpaces.length < 2) {
        return res.status(200).json({
          success: true,
          users: [],
          total: 0,
          hasMore: false,
        });
      }

      interface SanitizedStudentMatch {
        id: string;
        uid: string;
        name: string;
        displayName: string;
        handle: string;
        email: string;
        avatar: string | null;
        shortId: string;
        plan: 'free' | 'pro';
        role: string;
        status: 'active' | 'suspended' | 'inactive' | 'orphan' | 'missing-name';
        kobans: number;
        hasWallet: boolean;
      }

      const byKey = new Map<string, SanitizedStudentMatch>();
      const uidByEmail = new Map<string, string>();

      const upsertCandidate = (cand: SanitizedStudentMatch) => {
        const uid = String(cand.uid || cand.id || '').trim();
        if (!uid || uid.startsWith('bot_') || cand.role === 'bot') return;

        const cleanEmail = String(cand.email || '').trim().toLowerCase();
        const existingUidForEmail = cleanEmail ? uidByEmail.get(cleanEmail) : undefined;
        const targetKey =
          existingUidForEmail && byKey.has(existingUidForEmail) ? existingUidForEmail : uid;

        const existing = byKey.get(targetKey);
        if (!existing) {
          byKey.set(targetKey, {
            ...cand,
            id: targetKey,
            uid: targetKey,
            email: cleanEmail,
            shortId: cand.shortId || targetKey.slice(0, 5).toUpperCase(),
          });
          if (cleanEmail) uidByEmail.set(cleanEmail, targetKey);
        } else {
          const hasRealExistingName =
            Boolean(existing.name) &&
            existing.name !== 'Unnamed Student' &&
            existing.name !== existing.email;
          const mergedName = hasRealExistingName ? existing.name : cand.name || existing.name;
          const mergedEmail = existing.email || cleanEmail;
          const mergedHandle =
            existing.handle || cand.handle || (mergedEmail ? mergedEmail.split('@')[0] : '');
          const hasWallet = existing.hasWallet || cand.hasWallet;
          const kobans = Math.max(existing.kobans, cand.kobans);
          let mergedStatus = existing.status;
          if (existing.status === 'orphan' && cand.status !== 'orphan') {
            mergedStatus = cand.status;
          }

          byKey.set(targetKey, {
            id: targetKey,
            uid: targetKey,
            name: mergedName,
            displayName: mergedName || mergedEmail || 'Student',
            handle: mergedHandle,
            email: mergedEmail,
            avatar: existing.avatar || cand.avatar,
            shortId: existing.shortId || cand.shortId || targetKey.slice(0, 5).toUpperCase(),
            plan: existing.plan === 'pro' || cand.plan === 'pro' ? 'pro' : 'free',
            role: existing.role !== 'student' ? existing.role : cand.role,
            status: mergedStatus,
            kobans,
            hasWallet,
          });
          if (mergedEmail) uidByEmail.set(mergedEmail, targetKey);
        }
      };

      // 0. Query Firestore canonical `users` + LEFT JOIN `wallets` + `publicProfiles` + requests via REST
      const [fsUsers, fsProfiles, fsWallets, fsKobanReqs, fsPaymentReqs] = await Promise.all([
        fetchFirestoreCollectionRest('users', authHeader, 1000),
        fetchFirestoreCollectionRest('publicProfiles', authHeader, 1000),
        fetchFirestoreCollectionRest('wallets', authHeader, 1000),
        fetchFirestoreCollectionRest('kobanRequests', authHeader, 300),
        fetchFirestoreCollectionRest('paymentRequests', authHeader, 300),
      ]);

      const walletMap = new Map<string, number>();
      for (const w of fsWallets) {
        const bal =
          typeof w.data.balance === 'number' && Number.isFinite(w.data.balance)
            ? w.data.balance
            : 0;
        walletMap.set(w.id, bal);
      }

      const pubMap = new Map<string, Record<string, any>>();
      for (const p of fsProfiles) {
        pubMap.set(p.id, p.data);
      }

      const userIdsInFsUsers = new Set<string>();
      for (const u of fsUsers) {
        const uid = u.id;
        if (!uid || uid.startsWith('bot_')) continue;
        const data = u.data;
        if (data.role === 'bot' || data.deleted === true || data.status === 'deleted') continue;

        userIdsInFsUsers.add(uid);
        const pub = pubMap.get(uid) || {};
        const email = String(data.email || pub.email || '').trim().toLowerCase();
        const rawName = String(
          data.displayName || data.fullName || data.name || pub.displayName || pub.name || ''
        ).trim();
        const hasMissingName = !rawName || rawName === 'Unnamed Student';
        const rawHandle = String(
          data.username ||
            data.handle ||
            pub.username ||
            pub.handle ||
            (email ? email.split('@')[0] : '')
        )
          .trim()
          .replace(/^@+/, '');

        let status: SanitizedStudentMatch['status'] = 'active';
        if (data.suspended === true || data.isBanned === true || data.status === 'suspended') {
          status = 'suspended';
        } else if (data.status === 'inactive' || data.active === false) {
          status = 'inactive';
        } else if (hasMissingName) {
          status = 'missing-name';
        }

        const hasWallet = walletMap.has(uid);
        const kobans = hasWallet
          ? walletMap.get(uid)!
          : typeof data.kobans === 'number' && Number.isFinite(data.kobans)
          ? data.kobans
          : 0;

        upsertCandidate({
          id: uid,
          uid,
          name: hasMissingName ? '' : rawName,
          displayName: hasMissingName ? email || 'Unnamed Student' : rawName,
          handle: rawHandle,
          email,
          avatar: sanitizeStoreAvatarId(
            data.equipped?.avatar,
            data.equippedAvatar,
            data.avatar,
            pub.equipped?.avatar,
            pub.equippedAvatar,
            pub.avatar
          ),
          shortId: String(data.shortId || pub.shortId || uid.slice(0, 5).toUpperCase()),
          plan: data.plan === 'pro' || data.isPremium === true ? 'pro' : 'free',
          role: String(data.role || 'student'),
          status,
          kobans,
          hasWallet,
        });
      }

      for (const p of fsProfiles) {
        const uid = p.id;
        if (!uid || uid.startsWith('bot_') || userIdsInFsUsers.has(uid)) continue;
        const pub = p.data;
        if (pub.role === 'bot') continue;
        const email = String(pub.email || '').trim().toLowerCase();
        const rawName = String(pub.displayName || pub.name || '').trim();
        const rawHandle = String(
          pub.username || pub.handle || (email ? email.split('@')[0] : '')
        )
          .trim()
          .replace(/^@+/, '');
        const hasWallet = walletMap.has(uid);

        upsertCandidate({
          id: uid,
          uid,
          name: rawName === 'Unnamed Student' ? '' : rawName,
          displayName: rawName || email || `Orphan (${uid.slice(0, 6)})`,
          handle: rawHandle,
          email,
          avatar: sanitizeStoreAvatarId(pub.equipped?.avatar, pub.equippedAvatar, pub.avatar),
          shortId: String(pub.shortId || uid.slice(0, 5).toUpperCase()),
          plan: pub.plan === 'pro' ? 'pro' : 'free',
          role: String(pub.role || 'student'),
          status: 'orphan',
          kobans: hasWallet ? walletMap.get(uid)! : 0,
          hasWallet,
        });
      }

      for (const r of [...fsKobanReqs, ...fsPaymentReqs]) {
        const d = r.data;
        const uid = String(d.userId || '').trim();
        if (!uid || uid.startsWith('bot_')) continue;
        const email = String(d.userEmail || '').trim().toLowerCase();
        const rawName = String(d.userName || '').trim();
        const hasWallet = walletMap.has(uid);
        upsertCandidate({
          id: uid,
          uid,
          name: rawName === 'Student' ? '' : rawName,
          displayName: rawName || email || 'Student',
          handle: email ? email.split('@')[0] : '',
          email,
          avatar: null,
          shortId: uid.slice(0, 5).toUpperCase(),
          plan: 'free',
          role: 'student',
          status: userIdsInFsUsers.has(uid) ? 'active' : 'orphan',
          kobans: hasWallet ? walletMap.get(uid)! : 0,
          hasWallet,
        });
      }

      const store = loadD1Store();

      // 1. Scan D1 userRoles table
      for (const r of store.userRoles || []) {
        if (!r.uid || r.uid.startsWith('bot_')) continue;
        const emailLower = String(r.email || '').trim().toLowerCase();
        const emailPrefix = emailLower ? emailLower.split('@')[0] : '';
        const hasWallet = walletMap.has(r.uid);
        upsertCandidate({
          id: r.uid,
          uid: r.uid,
          name: emailPrefix || '',
          displayName: emailPrefix || emailLower || 'Student',
          handle: emailPrefix,
          email: emailLower,
          avatar: null,
          shortId: r.uid.slice(0, 5).toUpperCase(),
          plan: 'free',
          role: r.role || 'student',
          status: r.is_posting_banned ? 'suspended' : emailPrefix ? 'active' : 'missing-name',
          kobans: hasWallet ? walletMap.get(r.uid)! : 0,
          hasWallet,
        });
      }

      // 2. Scan D1 posts & comments authors for student profiles active in Commons
      for (const p of store.posts || []) {
        const uid = p.real_author_uid || p.author_uid;
        if (!uid || uid.startsWith('bot_') || p.author_role === 'bot') continue;
        const authorName =
          p.is_anonymous || p.author_name === 'Anonymous Student'
            ? ''
            : String(p.author_name || '').trim();
        const handleGuess = authorName
          ? authorName.toLowerCase().replace(/[^a-z0-9_]/g, '')
          : '';
        const hasWallet = walletMap.has(uid);
        upsertCandidate({
          id: uid,
          uid,
          name: authorName,
          displayName: authorName || 'Student',
          handle: handleGuess,
          email: '',
          avatar: sanitizeStoreAvatarId(p.author_equipped_avatar, p.author_avatar),
          shortId: uid.slice(0, 5).toUpperCase(),
          plan: 'free',
          role: p.author_role || 'student',
          status: authorName ? 'active' : 'missing-name',
          kobans: hasWallet ? walletMap.get(uid)! : 0,
          hasWallet,
        });
      }

      for (const c of store.comments || []) {
        const uid = c.real_author_uid || c.author_uid;
        if (!uid || uid.startsWith('bot_') || c.author_role === 'bot') continue;
        const authorName =
          c.is_anonymous || c.author_name === 'Anonymous Student'
            ? ''
            : String(c.author_name || '').trim();
        const handleGuess = authorName
          ? authorName.toLowerCase().replace(/[^a-z0-9_]/g, '')
          : '';
        const hasWallet = walletMap.has(uid);
        upsertCandidate({
          id: uid,
          uid,
          name: authorName,
          displayName: authorName || 'Student',
          handle: handleGuess,
          email: '',
          avatar: sanitizeStoreAvatarId(c.author_equipped_avatar, c.author_avatar),
          shortId: uid.slice(0, 5).toUpperCase(),
          plan: 'free',
          role: c.author_role || 'student',
          status: authorName ? 'active' : 'missing-name',
          kobans: hasWallet ? walletMap.get(uid)! : 0,
          hasWallet,
        });
      }

      // 3. If the query looks like an email address, also check Firebase Identity Toolkit
      const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(qNoSpaces);
      if (looksLikeEmail) {
        const accessToken = options?.getGoogleAccessToken
          ? await options.getGoogleAccessToken().catch(() => null)
          : null;

        if (accessToken) {
          try {
            const lookupResp = await fetch(
              `https://identitytoolkit.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/accounts:lookup`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: [qNoSpaces] }),
              }
            );
            if (lookupResp.ok) {
              const lookupData = (await lookupResp.json().catch(() => ({}))) as any;
              const authUsers = Array.isArray(lookupData?.users) ? lookupData.users : [];
              for (const au of authUsers) {
                const uid = String(au.localId || '').trim();
                const email = String(au.email || qNoSpaces).trim().toLowerCase();
                const displayName = String(au.displayName || '').trim();
                const handle = email.split('@')[0] || '';
                if (uid) {
                  const hasWallet = walletMap.has(uid);
                  upsertCandidate({
                    id: uid,
                    uid,
                    name: displayName,
                    displayName: displayName || email || 'Student',
                    handle,
                    email,
                    avatar: au.photoUrl || null,
                    shortId: uid.slice(0, 5).toUpperCase(),
                    plan: 'free',
                    role:
                      SUPERADMIN_EMAILS.has(email) || SUPERADMIN_UIDS.has(uid)
                        ? 'superadmin'
                        : 'student',
                    status: au.disabled ? 'suspended' : displayName ? 'active' : 'missing-name',
                    kobans: hasWallet ? walletMap.get(uid)! : 0,
                    hasWallet,
                  });
                }
              }
            }
          } catch {
            // Ignore Identity Toolkit Admin lookup error
          }
        }
      }

      // Score and filter candidates against normalized query
      const scored: Array<{ item: SanitizedStudentMatch; score: number }> = [];
      for (const u of byKey.values()) {
        const emailLower = (u.email || '').toLowerCase();
        const nameLower = (u.name || '').toLowerCase();
        const displayLower = (u.displayName || '').toLowerCase();
        const handleLower = (u.handle || '').toLowerCase().replace(/^@+/, '');
        const idLower = (u.id || '').toLowerCase();
        const shortIdLower = (u.shortId || idLower.slice(0, 6)).toLowerCase();

        let score = 0;
        if (emailLower && emailLower === qNoSpaces) {
          score = 100;
        } else if (emailLower && emailLower.startsWith(qNoSpaces)) {
          score = 90;
        } else if (handleLower && handleLower === qHandle) {
          score = 88;
        } else if (idLower === qNoSpaces || shortIdLower === qShortId) {
          score = 85;
        } else if (emailLower && emailLower.includes(qNoSpaces)) {
          score = 80;
        } else if (nameLower && (nameLower === qNorm || displayLower === qNorm)) {
          score = 78;
        } else if (
          nameLower &&
          (nameLower.startsWith(qNorm) ||
            nameLower.includes(qNorm) ||
            nameLower.includes(qNoSpaces))
        ) {
          score = 72;
        } else if (
          displayLower &&
          (displayLower.includes(qNorm) || displayLower.includes(qNoSpaces))
        ) {
          score = 68;
        } else if (handleLower && handleLower.includes(qHandle)) {
          score = 65;
        } else if (idLower.includes(qNoSpaces) || shortIdLower.includes(qShortId)) {
          score = 55;
        }

        if (score > 0) {
          scored.push({ item: u, score });
        }
      }

      scored.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return (b.item.kobans || 0) - (a.item.kobans || 0);
      });

      const d1BadgeTable = getSharedLocalD1Database().tables.user_pro_badge;
      const nowSearchMs = Date.now();
      const matched = scored.map((s) => {
        const item = s.item;
        const badgeRow = d1BadgeTable.get(item.uid);
        const savedDesign = badgeRow
          ? normalizeProBadgeDesign(badgeRow.design)
          : DEFAULT_PRO_BADGE_DESIGN;
        const isVisible = badgeRow ? Number(badgeRow.visible ?? 1) !== 0 : true;
        const unified = resolveUnifiedPlanStatus({
          uid: item.uid,
          email: item.email,
          role: item.role,
          isGuest: item.uid.startsWith('guest_'),
          plan: item.plan,
          isPremium: item.plan === 'pro',
          nowMs: nowSearchMs,
        });
        const activePro = unified.state === 'active' || Boolean(unified.isPro);
        return {
          ...item,
          proBadge: activePro && isVisible ? savedDesign : null,
          proBadgeDesign: activePro ? savedDesign : badgeRow ? savedDesign : null,
          proBadgeVisible: isVisible,
        };
      });
      const paged = matched.slice(offsetCount, offsetCount + limitCount);
      return res.status(200).json({
        success: true,
        users: paged,
        total: matched.length,
        hasMore: offsetCount + limitCount < matched.length,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err?.message || 'Student search failed on server.',
        users: [],
      });
    }
  };

  app.get('/api/admin/users/search', handleAdminKobansUserSearch);
  app.get('/api/admin/kobans/users/search', handleAdminKobansUserSearch);
  app.get('/api/admin/kobans/search', handleAdminKobansUserSearch);

  // ==========================================================================
  // WELCOME TO BOARDLY ANNOUNCEMENT ROUTES (/api/announcements/*)
  // ==========================================================================
  app.get('/api/announcements/welcome', async (req, res) => {
    const store = loadD1Store();
    const user = await verifyFirebaseJwtZeroFirestore(req).catch(() => null);
    const queryUid = String(req.query.userId || user?.uid || '').trim();

    let welcomeRow = (store.announcements || []).find(
      (a) => a.id === DEFAULT_WELCOME_ANNOUNCEMENT.id
    );
    if (!welcomeRow) {
      welcomeRow = {
        id: DEFAULT_WELCOME_ANNOUNCEMENT.id,
        title: DEFAULT_WELCOME_ANNOUNCEMENT.title,
        message: DEFAULT_WELCOME_ANNOUNCEMENT.message,
        is_pinned: 1,
        author_uid: DEFAULT_WELCOME_ANNOUNCEMENT.authorUid,
        author_email: DEFAULT_WELCOME_ANNOUNCEMENT.authorEmail,
        author_name: DEFAULT_WELCOME_ANNOUNCEMENT.authorName,
        created_at: 1743465600000,
        updated_at: 1743465600000,
      };
    }

    let welcomed = false;
    let readWelcome = false;
    if (queryUid) {
      const st = (store.userWelcomeStatus || []).find((u) => u.user_uid === queryUid);
      if (st) {
        welcomed = Boolean(st.welcomed);
        readWelcome = Boolean(st.read_welcome);
      }
    }

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    const statusObj = queryUid ? { userId: queryUid, welcomed, read: readWelcome } : null;
    return res.status(200).json({
      success: true,
      announcement: {
        id: welcomeRow.id,
        title: welcomeRow.title,
        message: welcomeRow.message,
        isPinned: Boolean(welcomeRow.is_pinned ?? 1),
        authorId: welcomeRow.author_uid,
        authorEmail: welcomeRow.author_email,
        authorName: welcomeRow.author_name || 'Superadmin',
        createdAtMs: Number(welcomeRow.created_at || Date.now()),
        updatedAtMs: Number(welcomeRow.updated_at || Date.now()),
      },
      userStatus: statusObj,
      welcomeStatus: statusObj || { welcomed: false, read: false },
    });
  });

  app.post('/api/announcements/welcome/ensure', async (req, res) => {
    const user = await verifyFirebaseJwtZeroFirestore(req).catch(() => null);
    const body = req.body || {};
    const targetUid = String(user?.uid || body.userId || '').trim();
    if (!targetUid) {
      return res.status(400).json({ success: false, error: 'Missing userId.' });
    }

    const store = loadD1Store();
    if (!Array.isArray(store.userWelcomeStatus)) store.userWelcomeStatus = [];
    const now = Date.now();
    let existing = store.userWelcomeStatus.find((u) => u.user_uid === targetUid);
    const alreadyWelcomed = Boolean(existing?.welcomed);

    if (!existing) {
      existing = {
        user_uid: targetUid,
        welcomed: 1,
        read_welcome: 0,
        welcomed_at: now,
        read_at: null,
      };
      store.userWelcomeStatus.push(existing);
      saveD1Store(store);
    }

    const welcomeRow = (store.announcements || []).find(
      (a) => a.id === DEFAULT_WELCOME_ANNOUNCEMENT.id
    );

    return res.status(200).json({
      success: true,
      userId: targetUid,
      welcomed: true,
      newlyWelcomed: !alreadyWelcomed,
      read: Boolean(existing.read_welcome),
      announcement: {
        id: welcomeRow?.id || DEFAULT_WELCOME_ANNOUNCEMENT.id,
        title: welcomeRow?.title || DEFAULT_WELCOME_ANNOUNCEMENT.title,
        message: welcomeRow?.message || DEFAULT_WELCOME_ANNOUNCEMENT.message,
        isPinned: true,
        authorName: welcomeRow?.author_name || 'Superadmin',
        createdAtMs: Number(welcomeRow?.created_at || now),
      },
    });
  });

  app.post('/api/announcements/welcome/read', async (req, res) => {
    const user = await verifyFirebaseJwtZeroFirestore(req).catch(() => null);
    const body = req.body || {};
    const targetUid = String(user?.uid || body.userId || '').trim();
    if (!targetUid) {
      return res.status(400).json({ success: false, error: 'Missing userId.' });
    }

    const store = loadD1Store();
    if (!Array.isArray(store.userWelcomeStatus)) store.userWelcomeStatus = [];
    if (!Array.isArray(store.userReadAnnouncements)) store.userReadAnnouncements = [];
    const now = Date.now();
    let existing = store.userWelcomeStatus.find((u) => u.user_uid === targetUid);
    if (!existing) {
      existing = {
        user_uid: targetUid,
        welcomed: 1,
        read_welcome: 1,
        welcomed_at: now,
        read_at: now,
      };
      store.userWelcomeStatus.push(existing);
    } else {
      existing.welcomed = 1;
      existing.read_welcome = 1;
      existing.read_at = now;
    }

    if (
      !store.userReadAnnouncements.some(
        (r) => r.user_uid === targetUid && r.announcement_id === DEFAULT_WELCOME_ANNOUNCEMENT.id
      )
    ) {
      store.userReadAnnouncements.push({
        user_uid: targetUid,
        announcement_id: DEFAULT_WELCOME_ANNOUNCEMENT.id,
        read_at: now,
      });
    }

    saveD1Store(store);

    return res.status(200).json({ success: true, userId: targetUid, read: true });
  });

  // ==========================================================================
  // D1 FOLLOWS & NOTIFICATIONS ROUTES (/api/follows & /api/notifications)
  // ==========================================================================
  app.get('/api/follows', async (req, res) => {
    const store = loadD1Store();
    if (!Array.isArray(store.follows)) store.follows = [];
    const followerUid = String(req.query.followerUid || '').trim();
    const followingUid = String(req.query.followingUid || '').trim();

    if (followerUid && followingUid) {
      const isFollowing = store.follows.some(
        (f) => f.follower_uid === followerUid && f.following_uid === followingUid
      );
      return res.status(200).json({ success: true, isFollowing });
    }
    if (followingUid) {
      const followerIds = store.follows
        .filter((f) => f.following_uid === followingUid)
        .map((f) => f.follower_uid);
      const liveMap = resolveLiveAuthorsBatchSync(followerIds, store);
      const followers = followerIds.map((uid) => {
        const live = liveMap.get(uid);
        return {
          uid,
          username: live?.username || null,
          displayName: live?.displayName || live?.username || 'Student',
          avatar: live?.avatar || null,
          frame: live?.frame || null,
          role: live?.role || 'student',
          customRole: live?.customRole || null,
        };
      });
      return res.status(200).json({
        success: true,
        followerIds,
        followers,
        followersCount: followerIds.length,
      });
    }
    if (followerUid) {
      const followingIds = store.follows
        .filter((f) => f.follower_uid === followerUid)
        .map((f) => f.following_uid);
      const liveMap = resolveLiveAuthorsBatchSync(followingIds, store);
      const following = followingIds.map((uid) => {
        const live = liveMap.get(uid);
        return {
          uid,
          username: live?.username || null,
          displayName: live?.displayName || live?.username || 'Student',
          avatar: live?.avatar || null,
          frame: live?.frame || null,
          role: live?.role || 'student',
          customRole: live?.customRole || null,
        };
      });
      return res.status(200).json({
        success: true,
        followingIds,
        following,
        followingCount: followingIds.length,
      });
    }
    return res.status(200).json({ success: true, follows: [] });
  });

  app.post('/api/follows', async (req, res) => {
    const user = await verifyFirebaseJwtZeroFirestore(req).catch(() => null);
    const body = req.body || {};
    const followerUid = String(user?.uid || body.followerUid || '').trim();
    const followingUid = String(body.followingUid || body.targetUserId || '').trim();
    const action = String(body.action || 'follow').toLowerCase();

    if (!followerUid || !followingUid || followerUid === followingUid) {
      return res.status(400).json({ success: false, error: 'Invalid follow parameters.' });
    }

    const store = loadD1Store();
    if (!Array.isArray(store.follows)) store.follows = [];
    if (!Array.isArray(store.notifications)) store.notifications = [];
    const now = Date.now();
    const existingIdx = store.follows.findIndex(
      (f) => f.follower_uid === followerUid && f.following_uid === followingUid
    );

    let following = false;
    if (action === 'unfollow' || (action === 'toggle' && existingIdx !== -1)) {
      if (existingIdx !== -1) {
        store.follows.splice(existingIdx, 1);
      }
      // Remove any post notifications from the unfollowed author in this user's feed
      store.notifications = store.notifications.filter((n) => {
        if (n.user_id !== followerUid) return true;
        const isPost =
          n.type === 'following_post' ||
          n.type === 'new_post' ||
          n.type === 'post' ||
          Boolean(n.post_id) ||
          /\bposted:\s*/i.test(String(n.title || ''));
        if (isPost && n.author_id === followingUid) {
          return false;
        }
        return true;
      });
      following = false;
    } else {
      if (existingIdx === -1) {
        store.follows.push({
          follower_uid: followerUid,
          following_uid: followingUid,
          created_at: now,
        });
      }
      following = true;

      const followerName = String(body.followerName || user?.name || 'A student').trim();
      const followerAvatar = sanitizeStoreAvatarId(body.followerAvatar);
      const followerFrame = body.followerFrame || null;
      const notifId = `follow_${followerUid}_${followingUid}`;
      const existingNotif = store.notifications.find((n) => n.id === notifId);
      if (!existingNotif) {
        store.notifications.unshift({
          id: notifId,
          user_id: followingUid,
          type: 'new_follower',
          title: `${followerName} started following you`,
          message: 'Tap to view their profile.',
          link: null,
          read: 0,
          is_pinned: 0,
          author_id: followerUid,
          author_name: followerName,
          author_avatar: followerAvatar,
          author_frame: followerFrame,
          post_id: null,
          post_type: null,
          created_at: now,
          read_at: null,
        });
      }
    }

    saveD1Store(store);
    const followersCount = store.follows.filter((f) => f.following_uid === followingUid).length;
    const followingCount = store.follows.filter((f) => f.follower_uid === followerUid).length;
    return res.status(200).json({ success: true, following, followersCount, followingCount });
  });

  app.get('/api/notifications', async (req, res) => {
    const user = await verifyFirebaseJwtZeroFirestore(req).catch(() => null);
    const userId = String(req.query.userId || user?.uid || '').trim();
    if (!userId) {
      return res.status(400).json({ success: false, error: 'Missing userId.' });
    }

    const followingKnown = String(req.query.followingKnown || '') === '1';
    const followingIdsParam = String(req.query.followingIds || '').trim();
    const clientFollowingSet = followingKnown
      ? new Set(
          followingIdsParam
            .split(',')
            .map((s) => s.trim())
            .filter((s) => Boolean(s) && s !== userId)
        )
      : null;

    const store = loadD1Store();
    if (!Array.isArray(store.notifications)) store.notifications = [];
    if (!Array.isArray(store.follows)) store.follows = [];
    if (!Array.isArray(store.userReadAnnouncements)) store.userReadAnnouncements = [];
    if (!Array.isArray(store.userWelcomeStatus)) store.userWelcomeStatus = [];

    // Reconcile D1 store.follows and purge unfollowed post notifications when client passes authoritative followingIds
    if (clientFollowingSet !== null) {
      let mutated = false;
      const beforeFollowsLen = store.follows.length;
      store.follows = store.follows.filter(
        (f) => f.follower_uid !== userId || clientFollowingSet.has(f.following_uid)
      );
      if (store.follows.length !== beforeFollowsLen) {
        mutated = true;
      }
      for (const targetUid of clientFollowingSet) {
        if (
          !store.follows.some(
            (f) => f.follower_uid === userId && f.following_uid === targetUid
          )
        ) {
          store.follows.push({
            follower_uid: userId,
            following_uid: targetUid,
            created_at: Date.now(),
          });
          mutated = true;
        }
      }

      const beforeNotifsLen = store.notifications.length;
      store.notifications = store.notifications.filter((n) => {
        if (n.user_id !== userId) return true;
        const isPost =
          n.type === 'following_post' ||
          n.type === 'new_post' ||
          n.type === 'post' ||
          Boolean(n.post_id) ||
          /\bposted:\s*/i.test(String(n.title || ''));
        if (!isPost) return true;
        const authorUid = String(n.author_id || '').trim();
        return Boolean(authorUid && authorUid !== userId && clientFollowingSet.has(authorUid));
      });
      if (store.notifications.length !== beforeNotifsLen) {
        mutated = true;
      }
      if (mutated) {
        saveD1Store(store);
      }
    }

    const d1FollowingSet =
      clientFollowingSet ??
      new Set(
        store.follows
          .filter((f) => f.follower_uid === userId && f.following_uid && f.following_uid !== userId)
          .map((f) => f.following_uid)
      );

    const seenKeys = new Set<string>();
    const filteredNotifs = store.notifications
      .filter((n) => {
        if (n.user_id !== userId) return false;
        const isPost =
          n.type === 'following_post' ||
          n.type === 'new_post' ||
          n.type === 'post' ||
          Boolean(n.post_id) ||
          /\bposted:\s*/i.test(String(n.title || ''));
        if (isPost) {
          const authorUid = String(n.author_id || '').trim();
          if (!authorUid || authorUid === userId || !d1FollowingSet.has(authorUid)) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => Number(b.created_at || 0) - Number(a.created_at || 0))
      .filter((n) => {
        const cleanTitle = String(n.title || '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, ' ')
          .trim();
        const cleanMsg = String(n.message || '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, ' ')
          .slice(0, 60)
          .trim();
        const dedupKey = n.post_id
          ? `post_${n.post_id}`
          : `${n.type || 'following_post'}_${n.author_id || ''}_${cleanTitle}_${cleanMsg}`;
        if (seenKeys.has(dedupKey)) return false;
        seenKeys.add(dedupKey);
        return true;
      })
      .slice(0, 100);

    // Batch-resolve all notification author profiles in ONE lookup
    const liveAuthorsMap = resolveLiveAuthorsBatchSync(
      filteredNotifs.map((n) => n.author_id),
      store
    );

    const userNotifs = filteredNotifs.map((n) => {
      const liveAuthor = n.author_id ? liveAuthorsMap.get(n.author_id) : undefined;
      const useLive = Boolean(liveAuthor && !liveAuthor.isDeleted);
      const resolvedAuthorName =
        (useLive && (liveAuthor?.displayName || liveAuthor?.username)) ||
        n.author_name ||
        undefined;
      const resolvedAuthorAvatar =
        (useLive && liveAuthor?.avatar) || sanitizeStoreAvatarId(n.author_avatar);
      const resolvedAuthorFrame =
        (useLive && liveAuthor?.frame) || n.author_frame || null;

      let rawTitle = String(n.title || '').replace(
        /Congratulations\s+(?:undefined|null|\[object Object\])\s*!/gi,
        'Congratulations!'
      );
      if (
        useLive &&
        resolvedAuthorName &&
        n.author_name &&
        n.author_name !== resolvedAuthorName &&
        rawTitle.startsWith(n.author_name)
      ) {
        rawTitle = resolvedAuthorName + rawTitle.slice(n.author_name.length);
      }

      return {
        id: n.id,
        userId: n.user_id,
        type: n.type || 'following_post',
        title: rawTitle,
        message: String(n.message || '').replace(
          /Congratulations\s+(?:undefined|null|\[object Object\])\s*!/gi,
          'Congratulations!'
        ),
        link: n.link || undefined,
        read: Boolean(n.read),
        isPinned: Boolean(n.is_pinned),
        authorId: n.author_id || undefined,
        authorName: resolvedAuthorName,
        authorUsername: (useLive && liveAuthor?.username) || undefined,
        authorAvatar: resolvedAuthorAvatar,
        authorFrame: resolvedAuthorFrame,
        postId: n.post_id || undefined,
        postType: n.post_type || undefined,
        createdAtMs: Number(n.created_at || Date.now()),
      };
    });

    const readAnnouncementIds = new Set<string>(
      store.userReadAnnouncements
        .filter((r) => r.user_uid === userId)
        .map((r) => r.announcement_id)
    );
    const welcomeSt = store.userWelcomeStatus.find((u) => u.user_uid === userId);
    if (welcomeSt?.read_welcome) {
      readAnnouncementIds.add(DEFAULT_WELCOME_ANNOUNCEMENT.id);
    }

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    return res.status(200).json({
      success: true,
      notifications: userNotifs,
      readAnnouncementIds: Array.from(readAnnouncementIds),
      welcomeRead: Boolean(welcomeSt?.read_welcome) || readAnnouncementIds.has(DEFAULT_WELCOME_ANNOUNCEMENT.id),
    });
  });

  app.post('/api/notifications/cleanup-unfollowed', async (req, res) => {
    const user = await verifyFirebaseJwtZeroFirestore(req).catch(() => null);
    const body = req.body || {};
    const userId = String(user?.uid || body.userId || '').trim();
    if (!userId) {
      return res.status(400).json({ success: false, error: 'Missing userId.' });
    }
    const followingIds: string[] = Array.isArray(body.followingIds)
      ? body.followingIds.map((id: unknown) => String(id || '').trim()).filter((id: string) => Boolean(id) && id !== userId)
      : [];
    const followingSet = new Set<string>(followingIds);

    const store = loadD1Store();
    if (!Array.isArray(store.notifications)) store.notifications = [];
    if (!Array.isArray(store.follows)) store.follows = [];

    const beforeNotifs = store.notifications.length;
    store.notifications = store.notifications.filter((n) => {
      if (n.user_id !== userId) return true;
      const isPost =
        n.type === 'following_post' ||
        n.type === 'new_post' ||
        n.type === 'post' ||
        Boolean(n.post_id) ||
        /\bposted:\s*/i.test(String(n.title || ''));
      if (!isPost) return true;
      const authorUid = String(n.author_id || '').trim();
      return Boolean(authorUid && authorUid !== userId && followingSet.has(authorUid));
    });
    const deletedCount = beforeNotifs - store.notifications.length;

    // Also sync store.follows for this user so D1 follows matches Firestore
    const beforeFollows = store.follows.length;
    store.follows = store.follows.filter(
      (f) => f.follower_uid !== userId || followingSet.has(f.following_uid)
    );
    let followsMutated = store.follows.length !== beforeFollows;
    for (const targetUid of followingSet) {
      if (
        !store.follows.some(
          (f) => f.follower_uid === userId && f.following_uid === targetUid
        )
      ) {
        store.follows.push({
          follower_uid: userId,
          following_uid: targetUid,
          created_at: Date.now(),
        });
        followsMutated = true;
      }
    }

    if (deletedCount > 0 || followsMutated) {
      saveD1Store(store);
    }

    return res.status(200).json({ success: true, deletedCount });
  });

  app.post('/api/notifications', async (req, res) => {
    const user = await verifyFirebaseJwtZeroFirestore(req).catch(() => null);
    const body = req.body || {};
    const items: any[] = Array.isArray(body.notifications)
      ? body.notifications
      : body.userId
      ? [body]
      : [];

    if (items.length === 0) {
      return res.status(400).json({ success: false, error: 'No notifications provided.' });
    }

    const store = loadD1Store();
    if (!Array.isArray(store.notifications)) store.notifications = [];
    if (!Array.isArray(store.follows)) store.follows = [];
    const now = Date.now();
    let created = 0;

    for (const item of items) {
      const targetUserId = String(item.userId || '').trim();
      const authorId = item.authorId ? String(item.authorId).trim() : user?.uid || null;
      if (!targetUserId || (authorId && targetUserId === authorId)) continue;
      if (item.isAnonymous) continue;

      const notifType = String(item.type || 'following_post');
      const isPostNotif =
        notifType === 'following_post' ||
        notifType === 'new_post' ||
        notifType === 'post' ||
        Boolean(item.postId) ||
        /\bposted:\s*/i.test(String(item.title || ''));

      // Post notifications must always have an authorId != targetUserId
      if (isPostNotif && (!authorId || authorId === targetUserId)) {
        continue;
      }

      const id = String(
        item.id ||
          (item.postId
            ? `post_${item.postId}_follower_${targetUserId}`
            : item.type === 'new_follower' && authorId
            ? `follow_${authorId}_${targetUserId}`
            : `notif_${now}_${crypto.randomUUID().slice(0, 8)}`)
      ).trim();

      if (store.notifications.some((n) => n.id === id)) continue;
      if (
        item.postId &&
        store.notifications.some(
          (n) => n.user_id === targetUserId && n.post_id === String(item.postId)
        )
      ) {
        continue;
      }

      const cleanTitle = String(item.title || 'New update').replace(
        /Congratulations\s+(?:undefined|null|\[object Object\])\s*!/gi,
        'Congratulations!'
      );
      const cleanMessage = String(item.message || '').replace(
        /Congratulations\s+(?:undefined|null|\[object Object\])\s*!/gi,
        'Congratulations!'
      );

      store.notifications.unshift({
        id,
        user_id: targetUserId,
        type: notifType,
        title: cleanTitle,
        message: cleanMessage,
        link: item.link ? String(item.link) : null,
        read: item.read ? 1 : 0,
        is_pinned: item.isPinned ? 1 : 0,
        author_id: authorId,
        author_name: item.authorName ? String(item.authorName) : null,
        author_avatar: sanitizeStoreAvatarId(item.authorAvatar),
        author_frame: item.authorFrame || null,
        post_id: item.postId ? String(item.postId) : null,
        post_type: item.postType ? String(item.postType) : null,
        created_at: Number(item.createdAtMs || now),
        read_at: item.read ? now : null,
      });
      created++;
    }

    if (created > 0) {
      saveD1Store(store);
    }

    return res.status(200).json({ success: true, created });
  });

  app.post('/api/notifications/read', async (req, res) => {
    const user = await verifyFirebaseJwtZeroFirestore(req).catch(() => null);
    const body = req.body || {};
    const userId = String(user?.uid || body.userId || '').trim();
    const notificationId = String(body.notificationId || body.id || '').trim();
    const isAnnouncement = Boolean(body.isAnnouncement);

    if (!userId || !notificationId) {
      return res.status(400).json({ success: false, error: 'Missing userId or notificationId.' });
    }

    const store = loadD1Store();
    if (!Array.isArray(store.notifications)) store.notifications = [];
    if (!Array.isArray(store.userReadAnnouncements)) store.userReadAnnouncements = [];
    if (!Array.isArray(store.userWelcomeStatus)) store.userWelcomeStatus = [];
    const now = Date.now();

    if (notificationId === DEFAULT_WELCOME_ANNOUNCEMENT.id || isAnnouncement) {
      if (
        !store.userReadAnnouncements.some(
          (r) => r.user_uid === userId && r.announcement_id === notificationId
        )
      ) {
        store.userReadAnnouncements.push({
          user_uid: userId,
          announcement_id: notificationId,
          read_at: now,
        });
      }
      if (notificationId === DEFAULT_WELCOME_ANNOUNCEMENT.id) {
        const welcomeSt = store.userWelcomeStatus.find((u) => u.user_uid === userId);
        if (!welcomeSt) {
          store.userWelcomeStatus.push({
            user_uid: userId,
            welcomed: 1,
            read_welcome: 1,
            welcomed_at: now,
            read_at: now,
          });
        } else {
          welcomeSt.welcomed = 1;
          welcomeSt.read_welcome = 1;
          welcomeSt.read_at = now;
        }
      }
    }

    const notif = store.notifications.find(
      (n) => n.id === notificationId && n.user_id === userId
    );
    if (notif) {
      notif.read = 1;
      notif.read_at = now;
    }

    saveD1Store(store);
    return res.status(200).json({ success: true, notificationId, read: true });
  });

  app.post('/api/notifications/read-all', async (req, res) => {
    const user = await verifyFirebaseJwtZeroFirestore(req).catch(() => null);
    const body = req.body || {};
    const userId = String(user?.uid || body.userId || '').trim();
    const announcementIds: string[] = Array.isArray(body.announcementIds)
      ? body.announcementIds.map(String)
      : [];

    if (!userId) {
      return res.status(400).json({ success: false, error: 'Missing userId.' });
    }

    const store = loadD1Store();
    if (!Array.isArray(store.notifications)) store.notifications = [];
    if (!Array.isArray(store.userReadAnnouncements)) store.userReadAnnouncements = [];
    if (!Array.isArray(store.userWelcomeStatus)) store.userWelcomeStatus = [];
    const now = Date.now();

    for (const n of store.notifications) {
      if (n.user_id === userId && !n.read) {
        n.read = 1;
        n.read_at = now;
      }
    }

    const allAnns = new Set<string>([
      DEFAULT_WELCOME_ANNOUNCEMENT.id,
      ...(store.announcements || []).map((a) => a.id),
      ...announcementIds,
    ]);
    for (const annId of allAnns) {
      if (!annId) continue;
      if (
        !store.userReadAnnouncements.some(
          (r) => r.user_uid === userId && r.announcement_id === annId
        )
      ) {
        store.userReadAnnouncements.push({
          user_uid: userId,
          announcement_id: annId,
          read_at: now,
        });
      }
    }

    const welcomeSt = store.userWelcomeStatus.find((u) => u.user_uid === userId);
    if (!welcomeSt) {
      store.userWelcomeStatus.push({
        user_uid: userId,
        welcomed: 1,
        read_welcome: 1,
        welcomed_at: now,
        read_at: now,
      });
    } else {
      welcomeSt.welcomed = 1;
      welcomeSt.read_welcome = 1;
      welcomeSt.read_at = now;
    }

    saveD1Store(store);
    return res.status(200).json({ success: true, userId, readAll: true });
  });

  app.put('/api/announcements/welcome', async (req, res) => {
    const user = await verifyFirebaseJwtZeroFirestore(req).catch(() => null);
    if (!user) {
      return res.status(401).json({
        success: false,
        code: 'UNAUTHENTICATED',
        error: 'Authentication required.',
      });
    }
    if (user.role !== 'superadmin') {
      const storeCheck = loadD1Store() as any;
      const nowMs = Date.now();
      const grant = (storeCheck.accessGrants || []).find(
        (g: any) =>
          g.adminUid === user.uid &&
          g.permission === 'announcements.manage' &&
          !g.revokedAt &&
          !g.usedAt &&
          (g.expiresAt === null || Number(g.expiresAt) > nowMs)
      );
      if (!grant) {
        return res.status(403).json({
          success: false,
          code: 'PERMISSION_DENIED',
          permission: 'announcements.manage',
          error: 'Permission denied: announcements.manage is required to edit announcements.',
        });
      }
      if (grant.duration === 'once') {
        grant.usedAt = nowMs;
        saveD1Store(storeCheck);
      }
    }

    const body = req.body || {};
    const title = String(body.title || DEFAULT_WELCOME_ANNOUNCEMENT.title).trim();
    const message = String(body.message || '').trim();
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        error: 'Title and message are required.',
      });
    }

    const store = loadD1Store();
    if (!Array.isArray(store.announcements)) store.announcements = [];
    const now = Date.now();
    const existing = store.announcements.find((a) => a.id === DEFAULT_WELCOME_ANNOUNCEMENT.id);
    if (existing) {
      existing.title = title;
      existing.message = message;
      existing.is_pinned = 1;
      existing.author_uid = user.uid;
      existing.author_email = user.email;
      existing.author_name = user.name || 'Superadmin';
      existing.updated_at = now;
    } else {
      store.announcements.unshift({
        id: DEFAULT_WELCOME_ANNOUNCEMENT.id,
        title,
        message,
        is_pinned: 1,
        author_uid: user.uid,
        author_email: user.email,
        author_name: user.name || 'Superadmin',
        created_at: now,
        updated_at: now,
      });
    }
    saveD1Store(store);

    return res.status(200).json({
      success: true,
      announcement: {
        id: DEFAULT_WELCOME_ANNOUNCEMENT.id,
        title,
        message,
        isPinned: true,
        authorId: user.uid,
        authorEmail: user.email,
        authorName: user.name || 'Superadmin',
        updatedAtMs: now,
      },
    });
  });

  // ==========================================================================
  // DAILY BOTS API ROUTES (/api/bots/*)
  // ==========================================================================
  app.get('/api/bots', (_req, res) => {
    const store = loadD1Store();
    const apiKeys = parseGeminiApiKeys(
      process.env.GEMINI_API_KEYS,
      process.env.GEMINI_API_KEY
    );
    const { model, fallbackModel } = resolvePinnedGeminiModels(
      process.env.GEMINI_MODEL,
      process.env.GEMINI_FALLBACK_MODEL
    );
    const pool = buildBotKeyPoolState({
      apiKeys,
      persistedStatuses: store.botKeyStatuses || [],
      lastUsedKeyIndex: store.botSystemState?.lastUsedKeyIndex ?? -1,
      allKeysExhaustedUntil: store.botSystemState?.allKeysExhaustedUntil ?? null,
    });
    const publicKeyStatuses = toPublicKeyStatusList(pool, BOARDLY_BOT_ACCOUNTS.length);
    const geminiCallsToday = getTotalGeminiCallsToday(pool);
    const geminiCallsLastRun = Number(
      store.botSystemState?.geminiCallsLastRun ??
        store.botSystemState?.lastRunSummary?.geminiCallsLastRun ??
        0
    );

    const bots = (store.botAccounts || []).map((r, idx) => {
      const actualPostCount = store.posts.filter(
        (p) => p.author_uid === r.uid || p.real_author_uid === r.uid
      ).length;
      const actualCommentCount = store.comments.filter(
        (c) => c.author_uid === r.uid || c.real_author_uid === r.uid
      ).length;
      const actualLikeCount = store.likes.filter((l) => l.user_uid === r.uid).length;
      const assignedKeyIndex = apiKeys.length > 0 ? idx % apiKeys.length : 0;
      return {
        uid: r.uid,
        username: r.username,
        displayName: r.display_name,
        subject: r.subject,
        avatar: r.avatar,
        bio: r.bio,
        enabled: Boolean(r.enabled),
        dailyPostLimit: Number(r.daily_post_limit || 2),
        postsCount: Math.max(Number(r.posts_count || 0), actualPostCount),
        commentsCount: Math.max(Number(r.comments_count || 0), actualCommentCount),
        likesCount: Math.max(Number(r.likes_count || 0), actualLikeCount),
        lastRunAt: r.last_run_at ? new Date(Number(r.last_run_at)).toISOString() : null,
        lastRunStatus: r.last_run_status || 'ready',
        assignedKeyIndex,
        assignedKeyLabel: apiKeys.length > 0 ? `Key #${assignedKeyIndex + 1}` : 'No key',
        role: 'bot',
      };
    });

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    return res.status(200).json({
      success: true,
      bots,
      totalBots: bots.length,
      enabledBots: bots.filter((b) => b.enabled).length,
      geminiConfigured: apiKeys.length > 0,
      geminiKeysCount: apiKeys.length,
      geminiModel: model,
      geminiFallbackModel: fallbackModel,
      botRunSecretConfigured: Boolean(process.env.BOT_RUN_SECRET),
      keyStatuses: publicKeyStatuses,
      allKeysExhaustedUntil:
        pool.allKeysExhaustedUntil && pool.allKeysExhaustedUntil > Date.now()
          ? new Date(pool.allKeysExhaustedUntil).toISOString()
          : null,
      geminiCallsLastRun,
      geminiCallsToday,
      lastRunSummary: store.botSystemState?.lastRunSummary || null,
      config: {
        geminiKeyConfigured: apiKeys.length > 0,
        geminiKeysCount: apiKeys.length,
        geminiModel: model,
        geminiFallbackModel: fallbackModel,
        botRunSecretConfigured: Boolean(process.env.BOT_RUN_SECRET),
        cronSchedule: '0 */2 * * * (Every 2 hours, 2-3 bots/batch)',
      },
    });
  });

  app.post('/api/bots/:uid/toggle', async (req, res) => {
    const user = await verifyFirebaseJwtZeroFirestore(req).catch(() => null);
    if (!user || user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error: 'Superadmin authorization required.',
      });
    }

    const botUid = String(req.params.uid || '').trim();
    const body = req.body || {};
    const store = loadD1Store();
    const botRow = (store.botAccounts || []).find((b) => b.uid === botUid);
    if (!botRow) {
      return res.status(404).json({ success: false, error: 'Bot not found.' });
    }

    const nextEnabled =
      typeof body.enabled === 'boolean' ? (body.enabled ? 1 : 0) : botRow.enabled ? 0 : 1;
    botRow.enabled = nextEnabled;
    botRow.updated_at = Date.now();
    saveD1Store(store);

    return res.status(200).json({
      success: true,
      uid: botUid,
      enabled: Boolean(nextEnabled),
    });
  });

  app.post('/api/bots/delete-content', async (req, res) => {
    const user = await verifyFirebaseJwtZeroFirestore(req).catch(() => null);
    if (!user || user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error: 'Superadmin authorization required.',
      });
    }

    const body = req.body || {};
    const targetBotUid = body.botUid ? String(body.botUid).trim() : null;
    const store = loadD1Store();

    const beforePosts = store.posts.length;
    const beforeComments = store.comments.length;
    const beforeLikes = store.likes.length;

    if (targetBotUid) {
      store.posts = store.posts.filter(
        (p) => p.author_uid !== targetBotUid && p.real_author_uid !== targetBotUid
      );
      store.comments = store.comments.filter(
        (c) => c.author_uid !== targetBotUid && c.real_author_uid !== targetBotUid
      );
      store.likes = store.likes.filter((l) => l.user_uid !== targetBotUid);
      const botRow = (store.botAccounts || []).find((b) => b.uid === targetBotUid);
      if (botRow) {
        botRow.posts_count = 0;
        botRow.comments_count = 0;
        botRow.likes_count = 0;
        botRow.updated_at = Date.now();
      }
    } else {
      store.posts = store.posts.filter(
        (p) =>
          p.author_role !== 'bot' &&
          !String(p.author_uid || '').startsWith('bot_') &&
          !String(p.real_author_uid || '').startsWith('bot_')
      );
      store.comments = store.comments.filter(
        (c) =>
          c.author_role !== 'bot' &&
          !String(c.author_uid || '').startsWith('bot_') &&
          !String(c.real_author_uid || '').startsWith('bot_')
      );
      store.likes = store.likes.filter((l) => !String(l.user_uid || '').startsWith('bot_'));
      for (const b of store.botAccounts || []) {
        b.posts_count = 0;
        b.comments_count = 0;
        b.likes_count = 0;
        b.updated_at = Date.now();
      }
    }

    // Recalculate post upvotes and comment counts
    for (const p of store.posts) {
      p.upvotes = store.likes.filter((l) => l.post_id === p.id).length;
      p.comment_count = store.comments.filter((c) => c.post_id === p.id).length;
    }

    saveD1Store(store);

    return res.status(200).json({
      success: true,
      deletedPosts: beforePosts - store.posts.length,
      deletedComments: beforeComments - store.comments.length,
      deletedLikes: beforeLikes - store.likes.length,
    });
  });

  app.post('/api/bots/run', async (req, res) => {
    const providedSecret = String(
      req.headers['x-bot-run-secret'] ||
        (String(req.headers.authorization || '').startsWith('Bearer ')
          ? String(req.headers.authorization || '').slice(7).trim()
          : '')
    ).trim();
    const configuredSecret = String(process.env.BOT_RUN_SECRET || '').trim();
    const hasValidSecret = Boolean(
      configuredSecret && providedSecret && providedSecret === configuredSecret
    );

    let isAdminCaller = false;
    if (!hasValidSecret) {
      const user = await verifyFirebaseJwtZeroFirestore(req).catch(() => null);
      if (user && user.role === 'superadmin') {
        isAdminCaller = true;
      }
    }

    if (!hasValidSecret && !isAdminCaller) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Missing or invalid BOT_RUN_SECRET header or Superadmin token.',
      });
    }

    const apiKeys = parseGeminiApiKeys(
      process.env.GEMINI_API_KEYS,
      process.env.GEMINI_API_KEY
    );
    const { model, fallbackModel } = resolvePinnedGeminiModels(
      process.env.GEMINI_MODEL,
      process.env.GEMINI_FALLBACK_MODEL
    );

    if (apiKeys.length === 0) {
      return res.status(500).json({
        success: false,
        runOutcome: 'error',
        bannerStatus: 'error',
        bannerMessage:
          'No Gemini API keys configured. Set GEMINI_API_KEYS (comma-separated) or GEMINI_API_KEY in environment variables.',
        error:
          'No Gemini API keys configured. Set GEMINI_API_KEYS (comma-separated) or GEMINI_API_KEY in environment variables.',
      });
    }

    const store = loadD1Store();
    const pool = buildBotKeyPoolState({
      apiKeys,
      persistedStatuses: store.botKeyStatuses || [],
      lastUsedKeyIndex: store.botSystemState?.lastUsedKeyIndex ?? -1,
      allKeysExhaustedUntil: store.botSystemState?.allKeysExhaustedUntil ?? null,
    });

    const persistPoolState = (summary?: any) => {
      store.botKeyStatuses = pool.keyStatuses.map((ks) => ({
        ...ks,
        lastError: ks.lastError ? redactApiKeysFromText(ks.lastError, apiKeys) : null,
      }));
      store.botSystemState = {
        lastUsedKeyIndex: pool.lastUsedKeyIndex,
        allKeysExhaustedUntil: pool.allKeysExhaustedUntil,
        geminiCallsLastRun: pool.callsThisRun,
        lastRunSummary: summary ?? store.botSystemState?.lastRunSummary ?? null,
      };
      saveD1Store(store);
    };

    const nowMs = Date.now();
    const activeKeyCount = pool.keyStatuses.filter((ks) => ks.status === 'available').length;
    if (
      activeKeyCount === 0 ||
      (pool.allKeysExhaustedUntil && pool.allKeysExhaustedUntil > nowMs)
    ) {
      const retryUntilMs =
        pool.allKeysExhaustedUntil ||
        Math.min(
          ...pool.keyStatuses
            .map((k) => k.cooldownUntil || nowMs + 60_000)
            .filter((v) => v > nowMs)
        );
      const retryIso = new Date(retryUntilMs).toISOString();
      const retryTimeFormatted = new Date(retryUntilMs).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Karachi',
      });
      const bannerMessage = `Gemini quota exhausted — all ${apiKeys.length} key(s) cooling down. Retrying after ${retryTimeFormatted} PKT (${retryIso}).`;

      const summaryPayload = {
        success: true,
        runOutcome: 'quota_exhausted',
        bannerStatus: 'error',
        bannerMessage,
        allKeysExhaustedUntil: retryIso,
        ranAt: new Date(nowMs).toISOString(),
        botsProcessed: 0,
        postsCreated: 0,
        commentsCreated: 0,
        likesAdded: 0,
        likesCreated: 0,
        geminiCallsLastRun: 0,
        geminiCallsToday: getTotalGeminiCallsToday(pool),
        geminiKeysCount: apiKeys.length,
        geminiModel: model,
        geminiFallbackModel: fallbackModel,
        keyStatuses: toPublicKeyStatusList(pool, BOARDLY_BOT_ACCOUNTS.length),
        results: [],
      };
      persistPoolState(summaryPayload);
      return res.status(200).json(summaryPayload);
    }

    const body = req.body || {};
    const targetBotUid = body.botUid ? String(body.botUid).trim() : null;
    // Cap each run to 2-3 bots chosen by least recently run
    const requestedMaxBots = Number(body.maxBots || (targetBotUid ? 1 : 2));
    const maxBotsPerCall = targetBotUid
      ? 1
      : Math.min(3, Math.max(1, Number.isFinite(requestedMaxBots) ? requestedMaxBots : 2));
    const postsPerBotReq = Math.min(2, Math.max(1, Number(body.postsPerBot || 1)));

    const candidateBots = (store.botAccounts || []).filter((b) =>
      targetBotUid ? b.uid === targetBotUid : b.enabled === 1
    );
    // Order by least recently run (last_run_at ASC NULLS FIRST)
    candidateBots.sort((a, b) => {
      const aRun = Number(a.last_run_at || 0);
      const bRun = Number(b.last_run_at || 0);
      if (aRun !== bRun) return aRun - bRun;
      return a.uid.localeCompare(b.uid);
    });
    const selectedBots = candidateBots.slice(0, maxBotsPerCall);

    const dayStartMs = new Date().setUTCHours(0, 0, 0, 0);
    const results: Array<{
      uid: string;
      botUid: string;
      displayName: string;
      subject: string;
      postsCreated: number;
      commentsCreated: number;
      likesAdded: number;
      likesCreated: number;
      geminiCallsUsed: number;
      assignedKeyIndex: number;
      status: string;
      error?: string;
    }> = [];

    let totalPostsCreated = 0;
    let totalCommentsCreated = 0;
    let totalLikesCreated = 0;
    let stoppedDueToAllKeysExhausted = false;
    let exhaustionBannerMessage: string | null = null;

    for (const botRow of selectedBots) {
      const botIndexInConfig = Math.max(
        0,
        BOARDLY_BOT_ACCOUNTS.findIndex((b) => b.uid === botRow.uid)
      );
      const assignedKeyIndex = apiKeys.length > 0 ? botIndexInConfig % apiKeys.length : 0;

      const botMeta =
        BOARDLY_BOT_ACCOUNTS[botIndexInConfig] || {
          uid: botRow.uid,
          placeholderName: botRow.username,
          displayName: botRow.display_name,
          email: `${botRow.username}@bots.boardly.cfd`,
          subject: botRow.subject as any,
          classLevel: '11' as const,
          board: 'Federal' as const,
          target: 'Federal & Entrance Exam Prep',
          equippedAvatar: botRow.avatar,
          bio: botRow.bio,
          chapters: [botRow.subject],
        };

      // Check D1 store BEFORE calling Gemini to enforce Max 2/day
      const alreadyPostedToday = store.posts.filter(
        (p) =>
          (p.author_uid === botRow.uid || p.real_author_uid === botRow.uid) &&
          Number(p.created_at || 0) >= dayStartMs
      ).length;
      const dailyLimit = Math.min(2, Math.max(1, Number(botRow.daily_post_limit || 2)));
      const remainingQuota = Math.max(0, dailyLimit - alreadyPostedToday);

      let postsCreated = 0;
      let commentsCreated = 0;
      let likesAdded = 0;
      let botGeminiCalls = 0;
      let lastError: string | undefined;

      // 1. Plain D1 likes first (no Gemini call)
      const candidatePosts = store.posts
        .filter(
          (p) =>
            p.is_hidden === 0 &&
            p.author_uid !== botRow.uid &&
            p.real_author_uid !== botRow.uid
        )
        .slice(0, 12);

      for (const other of candidatePosts.slice(0, 2)) {
        const alreadyLiked = store.likes.some(
          (l) => l.post_id === other.id && l.user_uid === botRow.uid
        );
        if (!alreadyLiked) {
          store.likes.push({
            post_id: other.id,
            user_uid: botRow.uid,
            created_at: Date.now(),
          });
          other.upvotes = (other.upvotes || 0) + 1;
          likesAdded++;
          totalLikesCreated++;
        }
      }

      if (remainingQuota <= 0) {
        botRow.likes_count = Number(botRow.likes_count || 0) + likesAdded;
        botRow.last_run_at = Date.now();
        botRow.last_run_status = `Daily post limit reached (${alreadyPostedToday}/${dailyLimit} today); ${likesAdded} like(s) added`;
        botRow.updated_at = Date.now();

        results.push({
          uid: botRow.uid,
          botUid: botRow.uid,
          displayName: botRow.display_name,
          subject: botRow.subject,
          postsCreated: 0,
          commentsCreated: 0,
          likesAdded,
          likesCreated: likesAdded,
          geminiCallsUsed: 0,
          assignedKeyIndex,
          status: 'daily_limit_reached',
        });
        continue;
      }

      const postsToCreate = Math.min(postsPerBotReq, remainingQuota);

      for (let i = 0; i < postsToCreate; i++) {
        const generated = await generateVerifiedBotStudyPost({
          bot: botMeta,
          keyPool: pool,
          botIndex: botIndexInConfig,
          model,
          fallbackModel,
          postIndex: alreadyPostedToday + i,
        });
        botGeminiCalls += generated.geminiCallsUsed || 0;

        if (!generated.post) {
          lastError = generated.discardReason || 'Generation skipped';
          console.error(
            `[BotRunner] Bot ${botRow.uid} (${botRow.display_name}) post generation failed:`,
            redactApiKeysFromText(lastError, apiKeys)
          );
          if (generated.allKeysExhausted) {
            stoppedDueToAllKeysExhausted = true;
            exhaustionBannerMessage = lastError;
            break;
          }
          continue;
        }

        const p = generated.post;
        const maxCreated = store.posts.reduce(
          (max, item) => Math.max(max, Number(item.created_at || 0)),
          0
        );
        const now = Math.max(Date.now(), maxCreated + 1);
        const postId = `post_bot_${now}_${crypto.randomUUID().slice(0, 6)}`;
        const slug = buildSlug(postId, p.title);

        store.posts.unshift({
          id: postId,
          slug,
          type: p.type,
          title: p.title,
          description: p.description,
          subject: botMeta.subject,
          chapter: p.chapter,
          target: botMeta.target,
          class_level: botMeta.classLevel,
          board: botMeta.board,
          format: 'text',
          tags_json: JSON.stringify(p.tags),
          files_json: '[]',
          is_anonymous: 0,
          anonymous_alias: 'Anonymous Student',
          author_uid: botRow.uid,
          real_author_uid: botRow.uid,
          author_name: botRow.display_name,
          author_avatar: botRow.avatar,
          author_frame: null,
          author_equipped_avatar: botRow.avatar,
          author_photo_url: null,
          author_role: 'bot',
          author_custom_role: `${botMeta.subject} Bot`,
          status: 'published',
          visibility: 'public',
          is_hidden: 0,
          is_pinned: 0,
          is_featured: 0,
          upvotes: 1,
          downvotes: 0,
          views: 1,
          comment_count: 0,
          save_count: 0,
          shares_count: 0,
          report_count: 0,
          created_at: now,
          updated_at: now,
        });
        if (!store.likes.some((l) => l.post_id === postId && l.user_uid === botRow.uid)) {
          store.likes.push({
            post_id: postId,
            user_uid: botRow.uid,
            created_at: now,
          });
        }
        postsCreated++;
        totalPostsCreated++;
      }

      const commentTarget =
        candidatePosts.find(
          (p) => p.subject.toLowerCase() === botRow.subject.toLowerCase()
        ) || candidatePosts[0];

      if (!stoppedDueToAllKeysExhausted && commentTarget && postsCreated > 0) {
        const alreadyCommented = store.comments.some(
          (c) => c.post_id === commentTarget.id && c.real_author_uid === botRow.uid
        );
        if (!alreadyCommented) {
          const commentRes = await generateVerifiedBotComment({
            bot: botMeta,
            targetPost: {
              title: commentTarget.title,
              description: commentTarget.description,
              subject: commentTarget.subject,
            },
            keyPool: pool,
            botIndex: botIndexInConfig,
            model,
            fallbackModel,
          });
          botGeminiCalls += commentRes.geminiCallsUsed || 0;
          if (commentRes.comment && commentRes.comment.text) {
            const commentId = `cmt_bot_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`;
            store.comments.push({
              id: commentId,
              post_id: commentTarget.id,
              text: commentRes.comment.text,
              is_anonymous: 0,
              author_uid: botRow.uid,
              real_author_uid: botRow.uid,
              author_name: botRow.display_name,
              author_avatar: botRow.avatar,
              author_frame: null,
              author_equipped_avatar: botRow.avatar,
              author_photo_url: null,
              author_role: 'bot',
              author_custom_role: `${botMeta.subject} Bot`,
              created_at: Date.now(),
            });
            commentTarget.comment_count = (commentTarget.comment_count || 0) + 1;
            commentsCreated++;
            totalCommentsCreated++;
          } else if (commentRes.allKeysExhausted) {
            stoppedDueToAllKeysExhausted = true;
            exhaustionBannerMessage =
              commentRes.discardReason || 'All Gemini API keys are cooling down.';
          }
        }
      }

      botRow.posts_count = Number(botRow.posts_count || 0) + postsCreated;
      botRow.comments_count = Number(botRow.comments_count || 0) + commentsCreated;
      botRow.likes_count = Number(botRow.likes_count || 0) + likesAdded;
      botRow.last_run_at = Date.now();
      botRow.last_run_status =
        postsCreated > 0
          ? `Published ${postsCreated} post(s), ${commentsCreated} comment(s), ${likesAdded} like(s)`
          : lastError
            ? `Error: ${lastError}`
            : `Skipped (0 posts, ${likesAdded} like(s))`;
      botRow.updated_at = Date.now();

      results.push({
        uid: botRow.uid,
        botUid: botRow.uid,
        displayName: botRow.display_name,
        subject: botRow.subject,
        postsCreated,
        commentsCreated,
        likesAdded,
        likesCreated: likesAdded,
        geminiCallsUsed: botGeminiCalls,
        assignedKeyIndex,
        status:
          postsCreated > 0
            ? 'ok'
            : stoppedDueToAllKeysExhausted
              ? 'quota_exhausted'
              : lastError
                ? 'error'
                : 'skipped',
        error: lastError,
      });

      if (stoppedDueToAllKeysExhausted) {
        break;
      }
    }

    const anyErrors = results.some((r) => Boolean(r.error));
    const allDailyLimit =
      results.length > 0 && results.every((r) => r.status === 'daily_limit_reached');

    let runOutcome: 'success' | 'partial' | 'quota_exhausted' | 'error' | 'daily_limit' = 'success';
    let bannerStatus: 'success' | 'warning' | 'error' = 'success';
    let bannerMessage = `Bot run finished: ${totalPostsCreated} post(s), ${totalCommentsCreated} comment(s), ${totalLikesCreated} like(s) published (${pool.callsThisRun} Gemini call(s) used).`;

    if (stoppedDueToAllKeysExhausted || (totalPostsCreated === 0 && anyErrors)) {
      const firstError =
        exhaustionBannerMessage ||
        results.find((r) => r.error)?.error ||
        'Gemini API error prevented post generation.';
      if (
        stoppedDueToAllKeysExhausted ||
        firstError.toLowerCase().includes('quota') ||
        firstError.includes('429') ||
        firstError.toLowerCase().includes('cooling down')
      ) {
        runOutcome = 'quota_exhausted';
        bannerStatus = 'error';
        const retryUntil =
          pool.allKeysExhaustedUntil ||
          Math.min(
            ...pool.keyStatuses
              .map((k) => k.cooldownUntil || Date.now() + 60_000)
              .filter((v) => v > Date.now())
          );
        const retryFormatted = Number.isFinite(retryUntil)
          ? new Date(retryUntil).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
              timeZone: 'Asia/Karachi',
            })
          : 'cooldown expires';
        bannerMessage = `Gemini quota exhausted (0 posts published). Retrying after ${retryFormatted} PKT. Full detail: ${firstError}`;
      } else {
        runOutcome = 'error';
        bannerStatus = 'error';
        bannerMessage = `Bot run published 0 posts due to errors: ${firstError}`;
      }
    } else if (totalPostsCreated > 0 && anyErrors) {
      runOutcome = 'partial';
      bannerStatus = 'warning';
      bannerMessage = `Partial bot run: ${totalPostsCreated} post(s), ${totalCommentsCreated} comment(s), ${totalLikesCreated} like(s) published, with some errors (${pool.callsThisRun} Gemini call(s)).`;
    } else if (totalPostsCreated === 0 && allDailyLimit) {
      runOutcome = 'daily_limit';
      bannerStatus = 'warning';
      bannerMessage = `Selected bots already reached their Max 2/day post limit (${totalLikesCreated} plain D1 like(s) added, 0 Gemini calls used).`;
    }

    const summaryPayload = {
      success: true,
      runOutcome,
      bannerStatus,
      bannerMessage,
      allKeysExhaustedUntil: pool.allKeysExhaustedUntil
        ? new Date(pool.allKeysExhaustedUntil).toISOString()
        : null,
      ranAt: new Date().toISOString(),
      botsProcessed: results.length,
      postsCreated: totalPostsCreated,
      commentsCreated: totalCommentsCreated,
      likesAdded: totalLikesCreated,
      likesCreated: totalLikesCreated,
      geminiCallsLastRun: pool.callsThisRun,
      geminiCallsToday: getTotalGeminiCallsToday(pool),
      geminiKeysCount: apiKeys.length,
      geminiModel: model,
      geminiFallbackModel: fallbackModel,
      keyStatuses: toPublicKeyStatusList(pool, BOARDLY_BOT_ACCOUNTS.length),
      results,
    };

    persistPoolState(summaryPayload);

    return res.status(200).json(summaryPayload);
  });

  // ===========================================================================
  // /api/questions — Cloudflare D1 Question Bank Endpoints
  // ===========================================================================
  const isStrictQuestionBankAdmin = (user: VerifiedFirebaseUser | null): boolean => {
    return Boolean(
      user && (SUPERADMIN_UIDS.has(user.uid) || user.role === 'superadmin' || user.role === 'admin')
    );
  };

  const normalizeQSubject = (raw: string): string => {
    const s = String(raw || '').trim().toLowerCase().replace(/[_\s]+/g, '-');
    if (s === 'cs' || s === 'computerscience') return 'computer-science';
    if (s === 'analytical' || s === 'analyticalreasoning') return 'analytical-reasoning';
    if (s === 'math' || s === 'maths') return 'mathematics';
    return s;
  };

  const formatD1QuestionForClient = (row: D1QuestionRow, includeAnswerKey: boolean) => {
    let options: string[] = [];
    try {
      const parsed = JSON.parse(row.options_json || '[]');
      if (Array.isArray(parsed)) options = parsed.map((o) => String(o ?? ''));
    } catch {
      options = [];
    }
    const base: Record<string, any> = {
      id: row.id,
      bank_id: row.bank_id || 'legacy',
      sourceId: row.bank_id || 'legacy',
      subject: row.subject,
      topic: row.topic,
      difficulty: row.difficulty || 'medium',
      status: row.status || 'published',
      needs_review: Number(row.needs_review || 0),
      needsReview: Boolean(row.needs_review),
      question_text: row.question_text,
      questionText: row.question_text,
      options,
      options_json: row.options_json || '[]',
      source_path: row.source_path || '',
      created_at: Number(row.created_at || Date.now()),
      updated_at: Number(row.updated_at || Date.now()),
      createdAt: new Date(Number(row.created_at || Date.now())).toISOString(),
      updatedAt: new Date(Number(row.updated_at || Date.now())).toISOString(),
    };
    if (includeAnswerKey) {
      base.correct_answer = Number(row.correct_answer ?? 0);
      base.correctAnswer = Number(row.correct_answer ?? 0);
      base.explanation = row.explanation || '';
    }
    return base;
  };

  const handleQuestionsHealthRoute = async (_req: Request, res: Response) => {
    const store = loadD1Store();
    const questions = Array.isArray(store.questions) ? store.questions : [];
    const importLogs = Array.isArray(store.questionsImportLog) ? store.questionsImportLog : [];

    const bankMeta: Record<string, { label: string; projectId: string }> = {
      legacy: { label: 'Core Bank (D1)', projectId: 'boardly-posts-db (legacy)' },
      bank1: { label: 'Alpha Bank (D1)', projectId: 'boardly-posts-db (bank1)' },
      bank2: { label: 'Beta Bank (D1)', projectId: 'boardly-posts-db (bank2)' },
    };

    const banks: Record<string, any> = {
      legacy: {
        bankId: 'legacy',
        label: bankMeta.legacy.label,
        total: 0,
        published: 0,
        needsReview: 0,
        bySubject: {},
        lastImportAt: null as string | null,
      },
      bank1: {
        bankId: 'bank1',
        label: bankMeta.bank1.label,
        total: 0,
        published: 0,
        needsReview: 0,
        bySubject: {},
        lastImportAt: null as string | null,
      },
      bank2: {
        bankId: 'bank2',
        label: bankMeta.bank2.label,
        total: 0,
        published: 0,
        needsReview: 0,
        bySubject: {},
        lastImportAt: null as string | null,
      },
    };

    const bySubjectTotal: Record<string, number> = {};
    const bySubjectPublished: Record<string, number> = {};
    const topicsBySubject: Record<string, Record<string, number>> = {};

    let totalQuestions = 0;
    let totalPublished = 0;
    let totalNeedsReview = 0;

    for (const q of questions) {
      const bankId = String(q.bank_id || 'legacy');
      const subject = String(q.subject || 'physics');
      const topic = String(q.topic || 'General');
      const status = String(q.status || 'published');
      const needsRev = Number(q.needs_review || 0) > 0;

      if (!banks[bankId]) {
        banks[bankId] = {
          bankId,
          label: `${bankId} (D1)`,
          total: 0,
          published: 0,
          needsReview: 0,
          bySubject: {},
          lastImportAt: null,
        };
      }

      banks[bankId].total += 1;
      if (status === 'published') banks[bankId].published += 1;
      if (needsRev) banks[bankId].needsReview += 1;
      banks[bankId].bySubject[subject] = (banks[bankId].bySubject[subject] || 0) + 1;

      bySubjectTotal[subject] = (bySubjectTotal[subject] || 0) + 1;
      if (status === 'published') {
        bySubjectPublished[subject] = (bySubjectPublished[subject] || 0) + 1;
      }

      if (!topicsBySubject[subject]) topicsBySubject[subject] = {};
      topicsBySubject[subject][topic] = (topicsBySubject[subject][topic] || 0) + 1;

      totalQuestions += 1;
      if (status === 'published') totalPublished += 1;
      if (needsRev) totalNeedsReview += 1;
    }

    let globalLastImportMs = 0;
    for (const log of importLogs) {
      const bId = String(log.bank_id || 'legacy');
      const ts = Number(log.imported_at || 0);
      if (ts > globalLastImportMs) globalLastImportMs = ts;
      if (banks[bId]) {
        const curMs = banks[bId].lastImportAt ? new Date(banks[bId].lastImportAt).getTime() : 0;
        if (ts > curMs) {
          banks[bId].lastImportAt = new Date(ts).toISOString();
        }
      }
    }

    const fallbackIso =
      globalLastImportMs > 0
        ? new Date(globalLastImportMs).toISOString()
        : store.migratedAt || new Date().toISOString();
    for (const bKey of Object.keys(banks)) {
      if (!banks[bKey].lastImportAt) {
        banks[bKey].lastImportAt = fallbackIso;
      }
    }

    const diagnostics = ['legacy', 'bank1', 'bank2'].map((bId) => ({
      sourceId: bId,
      label: banks[bId]?.label || `${bId} (D1)`,
      projectId: bankMeta[bId]?.projectId || `boardly-posts-db (${bId})`,
      status: 'healthy',
      latencyMs: 2,
      questionCount: banks[bId]?.total || 0,
      publishedCount: banks[bId]?.published || 0,
      needsReviewCount: banks[bId]?.needsReview || 0,
      bySubject: banks[bId]?.bySubject || {},
      lastImportAt: banks[bId]?.lastImportAt || fallbackIso,
    }));

    return res.status(200).json({
      source: 'cloudflare-d1',
      database: 'boardly-posts-db',
      totalQuestions,
      totalPublished,
      totalNeedsReview,
      lastImportAt: fallbackIso,
      bySubject: bySubjectTotal,
      bySubjectPublished,
      topicsBySubject,
      banks,
      diagnostics,
      importLogs: importLogs.slice(0, 50),
    });
  };

  app.get('/api/questions/health', handleQuestionsHealthRoute);
  app.get('/api/questions/stats', handleQuestionsHealthRoute);

  app.get('/api/questions/ids', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    const isAdmin = isStrictQuestionBankAdmin(user);
    const store = loadD1Store();
    const questions = Array.isArray(store.questions) ? store.questions : [];

    const bankParam = String(req.query.bank || req.query.bank_id || '').trim();
    const subjectParam = String(req.query.subject || '').trim();
    const topicParam = String(req.query.topic || '').trim();
    const difficultyParam = String(req.query.difficulty || '').trim().toLowerCase();
    const statusParam = String(req.query.status || '').trim().toLowerCase();

    const filtered = questions.filter((q) => {
      if (bankParam && bankParam !== 'all' && q.bank_id !== bankParam) return false;
      if (subjectParam && subjectParam !== 'all' && q.subject !== normalizeQSubject(subjectParam)) return false;
      if (topicParam && topicParam !== 'all' && q.topic !== topicParam) return false;
      if (difficultyParam && difficultyParam !== 'all' && q.difficulty !== difficultyParam) return false;
      if (isAdmin) {
        if (statusParam && statusParam !== 'all' && q.status !== statusParam) return false;
      } else {
        if (q.status !== 'published') return false;
      }
      return true;
    });

    const ids = filtered.map((q) => q.id);
    const items = filtered.map((q) => ({
      id: q.id,
      bank_id: q.bank_id,
      subject: q.subject,
      topic: q.topic,
      difficulty: q.difficulty,
    }));

    return res.status(200).json({
      ids,
      items,
      total: ids.length,
    });
  });

  app.post('/api/questions/verify', async (req: Request, res: Response) => {
    const body = req.body || {};
    const store = loadD1Store();
    const questions = Array.isArray(store.questions) ? store.questions : [];
    const qMap = new Map<string, D1QuestionRow>();
    for (const q of questions) {
      qMap.set(q.id, q);
    }

    const resolveCorrectIndex = (
      row: D1QuestionRow,
      displayedOptions?: string[]
    ): { correctIndex: number; canonicalCorrectText: string | null } => {
      let canonicalOptions: string[] = [];
      try {
        const parsed = JSON.parse(row.options_json || '[]');
        if (Array.isArray(parsed)) canonicalOptions = parsed.map((o) => String(o ?? ''));
      } catch {
        canonicalOptions = [];
      }
      const canonicalIdx = Number(row.correct_answer ?? 0);
      const canonicalCorrectText =
        canonicalIdx >= 0 && canonicalIdx < canonicalOptions.length
          ? canonicalOptions[canonicalIdx]
          : null;

      if (
        Array.isArray(displayedOptions) &&
        displayedOptions.length > 0 &&
        canonicalCorrectText !== null
      ) {
        const matchedIdx = displayedOptions.findIndex(
          (opt) => String(opt ?? '').trim() === canonicalCorrectText.trim()
        );
        if (matchedIdx !== -1) {
          return { correctIndex: matchedIdx, canonicalCorrectText };
        }
      }
      return { correctIndex: canonicalIdx, canonicalCorrectText };
    };

    if (Array.isArray(body.answers)) {
      const results: Record<
        string,
        {
          questionId: string;
          selectedAnswer: number | null;
          correct_answer: number;
          correctAnswer: number;
          canonical_correct_answer: number;
          isCorrect: boolean;
          explanation: string;
        }
      > = {};

      for (const item of body.answers) {
        const qId = String(item?.questionId || item?.id || '').trim();
        if (!qId) continue;
        const row = qMap.get(qId);
        if (!row) continue;

        const selected =
          item.selectedAnswer === null || item.selectedAnswer === undefined
            ? null
            : Number(item.selectedAnswer);
        const { correctIndex } = resolveCorrectIndex(
          row,
          Array.isArray(item.displayedOptions) ? item.displayedOptions : undefined
        );
        const isCorrect = selected !== null && Number.isFinite(selected) && selected === correctIndex;
        results[qId] = {
          questionId: qId,
          selectedAnswer: selected,
          correct_answer: correctIndex,
          correctAnswer: correctIndex,
          canonical_correct_answer: Number(row.correct_answer ?? 0),
          isCorrect,
          explanation: row.explanation || '',
        };
      }

      return res.status(200).json({
        verified: true,
        results,
      });
    }

    const questionId = String(body.questionId || body.id || '').trim();
    const hasSelectedAnswer =
      body.selectedAnswer !== undefined || body.answer !== undefined || body.selectedIndex !== undefined;

    if (!questionId || !hasSelectedAnswer) {
      return res.status(400).json({
        error: 'questionId and selectedAnswer are required to verify an answer.',
      });
    }

    const row = qMap.get(questionId);
    if (!row) {
      return res.status(404).json({ error: 'Question not found.' });
    }

    const rawAnswer = body.selectedAnswer ?? body.answer ?? body.selectedIndex;
    const selectedAnswer =
      rawAnswer === null || rawAnswer === undefined || rawAnswer === '' ? null : Number(rawAnswer);
    const { correctIndex } = resolveCorrectIndex(
      row,
      Array.isArray(body.displayedOptions) ? body.displayedOptions : undefined
    );
    const isCorrect =
      selectedAnswer !== null && Number.isFinite(selectedAnswer) && selectedAnswer === correctIndex;

    return res.status(200).json({
      questionId: row.id,
      selectedAnswer,
      correct_answer: correctIndex,
      correctAnswer: correctIndex,
      canonical_correct_answer: Number(row.correct_answer ?? 0),
      isCorrect,
      explanation: row.explanation || '',
    });
  });

  const handleBatchUpdateQuestions = async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!isStrictQuestionBankAdmin(user)) {
      return res.status(user ? 403 : 401).json({
        error: 'Forbidden: Only shsvirtualadmin@gmail.com can modify questions.',
      });
    }

    const body = req.body || {};
    const store = loadD1Store();
    if (!Array.isArray(store.questions)) store.questions = [];
    const now = Date.now();

    if (Array.isArray(body.questions)) {
      let imported = 0;
      let needsReviewCount = 0;

      for (const rawQ of body.questions) {
        const bankId = String(rawQ.bank_id || rawQ.sourceId || body.bank_id || 'legacy').trim();
        const rawId = String(rawQ.id || `q_${crypto.randomUUID().slice(0, 12)}`).trim();
        const id = rawId.startsWith(`${bankId}__`) || bankId === 'legacy' ? rawId : `${bankId}__${rawId}`;
        const subject = normalizeQSubject(rawQ.subject || body.subject || 'physics');
        const topic = String(rawQ.topic || 'General').trim() || 'General';
        const difficultyRaw = String(rawQ.difficulty || 'medium').trim().toLowerCase();
        const difficulty = ['easy', 'medium', 'hard'].includes(difficultyRaw) ? difficultyRaw : 'medium';
        const statusRaw = String(rawQ.status || 'published').trim().toLowerCase();
        const status = ['published', 'draft', 'archived'].includes(statusRaw) ? statusRaw : 'published';

        const rawQuestionText = String(rawQ.question_text ?? rawQ.questionText ?? '').trim();
        let rawOptions: string[] = [];
        if (Array.isArray(rawQ.options)) {
          rawOptions = rawQ.options.map((o: any) => String(o ?? ''));
        } else if (typeof rawQ.options_json === 'string') {
          try {
            const parsed = JSON.parse(rawQ.options_json);
            if (Array.isArray(parsed)) rawOptions = parsed.map((o: any) => String(o ?? ''));
          } catch {
            rawOptions = [];
          }
        }
        const rawExplanation = String(rawQ.explanation ?? '').trim();
        const correctAnswer = Number(rawQ.correct_answer ?? rawQ.correctAnswer ?? 0);

        const mathResult = validateAndNormalizeQuestionMath({
          questionText: rawQuestionText,
          options: rawOptions,
          explanation: rawExplanation,
        });
        const needsReview =
          rawQ.needs_review !== undefined
            ? Number(Boolean(rawQ.needs_review))
            : mathResult.needsReview
              ? 1
              : 0;
        if (needsReview) needsReviewCount++;

        const sourcePath = String(rawQ.source_path || `${bankId}/questions_${subject}/${id}`);
        const existingIdx = store.questions.findIndex(
          (q) => q.id === id || (q.bank_id === bankId && q.source_path === sourcePath)
        );
        const row: D1QuestionRow = {
          id: existingIdx !== -1 ? store.questions[existingIdx].id : id,
          bank_id: bankId,
          subject,
          topic,
          difficulty,
          status,
          needs_review: needsReview,
          question_text: mathResult.questionText,
          options_json: JSON.stringify(mathResult.options),
          correct_answer: Number.isFinite(correctAnswer) ? correctAnswer : 0,
          explanation: mathResult.explanation,
          source_path: sourcePath,
          created_at: existingIdx !== -1 ? store.questions[existingIdx].created_at : now,
          updated_at: now,
        };
        if (existingIdx !== -1) {
          store.questions[existingIdx] = row;
        } else {
          store.questions.push(row);
        }
        imported++;
      }

      saveD1Store(store);
      return res.status(200).json({
        success: true,
        imported,
        needsReviewCount,
      });
    }

    const ids: string[] = Array.isArray(body.ids)
      ? body.ids.map((x: any) => String(x || '').trim()).filter(Boolean)
      : [];
    const updates = body.updates || {};
    let updatedCount = 0;

    if (ids.length > 0) {
      const idSet = new Set(ids);
      for (const q of store.questions) {
        if (!idSet.has(q.id)) continue;
        if (updates.topic !== undefined) q.topic = String(updates.topic).trim();
        if (updates.subject !== undefined) q.subject = normalizeQSubject(updates.subject);
        if (updates.difficulty !== undefined) q.difficulty = String(updates.difficulty).trim().toLowerCase();
        if (updates.status !== undefined) q.status = String(updates.status).trim().toLowerCase();
        if (updates.needs_review !== undefined) q.needs_review = Number(Boolean(updates.needs_review));
        q.updated_at = now;
        updatedCount++;
      }
    } else if (body.subject && body.oldTopic && body.newTopic) {
      const subj = normalizeQSubject(body.subject);
      const oldTopic = String(body.oldTopic).trim();
      const newTopic = String(body.newTopic).trim();
      for (const q of store.questions) {
        if (q.subject === subj && q.topic === oldTopic) {
          q.topic = newTopic;
          q.updated_at = now;
          updatedCount++;
        }
      }
    }

    saveD1Store(store);
    return res.status(200).json({
      success: true,
      updatedCount,
    });
  };

  app.put('/api/questions/batch', handleBatchUpdateQuestions);
  app.post('/api/questions/batch', handleBatchUpdateQuestions);

  app.get('/api/questions', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    const isAdmin = isStrictQuestionBankAdmin(user);
    const store = loadD1Store();
    const questions = Array.isArray(store.questions) ? store.questions : [];

    const idsParam = String(req.query.ids || '').trim();
    const bankParam = String(req.query.bank || req.query.bank_id || '').trim();
    const subjectParam = String(req.query.subject || '').trim();
    const topicParam = String(req.query.topic || '').trim();
    const difficultyParam = String(req.query.difficulty || '').trim().toLowerCase();
    const statusParam = String(req.query.status || '').trim().toLowerCase();
    const needsReviewParam = String(req.query.needs_review ?? req.query.needsReview ?? '').trim();
    const searchParam = String(req.query.search || req.query.q || '').trim().toLowerCase();
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '100'), 10) || 100, 1), 1000);
    const offset = Math.max(parseInt(String(req.query.offset || '0'), 10) || 0, 0);

    const requestedIds = idsParam
      ? new Set(idsParam.split(',').map((s) => s.trim()).filter(Boolean))
      : null;

    const matching = questions.filter((q) => {
      if (requestedIds && !requestedIds.has(q.id)) return false;
      if (bankParam && bankParam !== 'all' && q.bank_id !== bankParam) return false;
      if (subjectParam && subjectParam !== 'all' && q.subject !== normalizeQSubject(subjectParam)) return false;
      if (topicParam && topicParam !== 'all' && q.topic !== topicParam) return false;
      if (difficultyParam && difficultyParam !== 'all' && q.difficulty !== difficultyParam) return false;
      if (isAdmin) {
        if (statusParam && statusParam !== 'all' && q.status !== statusParam) return false;
      } else {
        if (q.status !== 'published') return false;
      }
      if (needsReviewParam === '1' || needsReviewParam === 'true') {
        if (Number(q.needs_review || 0) !== 1) return false;
      } else if (needsReviewParam === '0' || needsReviewParam === 'false') {
        if (Number(q.needs_review || 0) !== 0) return false;
      }
      if (searchParam) {
        const hay = `${q.id} ${q.question_text} ${q.topic} ${q.subject} ${q.options_json}`.toLowerCase();
        if (!hay.includes(searchParam)) return false;
      }
      return true;
    });

    matching.sort((a, b) => Number(b.updated_at || 0) - Number(a.updated_at || 0) || a.id.localeCompare(b.id));
    const total = matching.length;
    const paged = matching.slice(offset, offset + limit);
    const formatted = paged.map((r) => formatD1QuestionForClient(r, isAdmin));

    return res.status(200).json({
      questions: formatted,
      total,
      limit,
      offset,
      hasMore: offset + formatted.length < total,
      isAdmin,
    });
  });

  app.post('/api/questions', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!isStrictQuestionBankAdmin(user)) {
      return res.status(user ? 403 : 401).json({
        error: 'Forbidden: Only shsvirtualadmin@gmail.com can create questions.',
      });
    }

    const body = req.body || {};
    const bankId = String(body.bank_id || body.sourceId || 'legacy').trim() || 'legacy';
    const rawId = String(body.id || `q_${crypto.randomUUID().slice(0, 12)}`).trim();
    const id = rawId.startsWith(`${bankId}__`) || bankId === 'legacy' ? rawId : `${bankId}__${rawId}`;
    const subject = normalizeQSubject(body.subject || 'physics');
    const topic = String(body.topic || 'General').trim() || 'General';
    const difficultyRaw = String(body.difficulty || 'medium').trim().toLowerCase();
    const difficulty = ['easy', 'medium', 'hard'].includes(difficultyRaw) ? difficultyRaw : 'medium';
    const statusRaw = String(body.status || 'published').trim().toLowerCase();
    const status = ['published', 'draft', 'archived'].includes(statusRaw) ? statusRaw : 'published';

    const rawQuestionText = String(body.question_text ?? body.questionText ?? '').trim();
    if (!rawQuestionText) {
      return res.status(400).json({ error: 'question_text is required.' });
    }

    let rawOptions: string[] = [];
    if (Array.isArray(body.options)) {
      rawOptions = body.options.map((o: any) => String(o ?? ''));
    } else if (typeof body.options_json === 'string') {
      try {
        const parsed = JSON.parse(body.options_json);
        if (Array.isArray(parsed)) rawOptions = parsed.map((o: any) => String(o ?? ''));
      } catch {
        rawOptions = [];
      }
    }
    if (rawOptions.length < 2) {
      return res.status(400).json({ error: 'At least 2 options are required.' });
    }

    const rawExplanation = String(body.explanation ?? '').trim();
    const correctAnswer = Number(body.correct_answer ?? body.correctAnswer ?? 0);

    const mathResult = validateAndNormalizeQuestionMath({
      questionText: rawQuestionText,
      options: rawOptions,
      explanation: rawExplanation,
    });

    const needsReview =
      body.needs_review !== undefined
        ? Number(Boolean(body.needs_review))
        : mathResult.needsReview
          ? 1
          : 0;
    const sourcePath = String(body.source_path || `${bankId}/questions_${subject}/${id}`).trim();
    const now = Date.now();

    const store = loadD1Store();
    if (!Array.isArray(store.questions)) store.questions = [];

    const existingIdx = store.questions.findIndex(
      (q) => q.id === id || (q.bank_id === bankId && q.source_path === sourcePath)
    );
    const savedRow: D1QuestionRow = {
      id: existingIdx !== -1 ? store.questions[existingIdx].id : id,
      bank_id: bankId,
      subject,
      topic,
      difficulty,
      status,
      needs_review: needsReview,
      question_text: mathResult.questionText,
      options_json: JSON.stringify(mathResult.options),
      correct_answer: Number.isFinite(correctAnswer) ? correctAnswer : 0,
      explanation: mathResult.explanation,
      source_path: sourcePath,
      created_at: existingIdx !== -1 ? store.questions[existingIdx].created_at : now,
      updated_at: now,
    };

    if (existingIdx !== -1) {
      store.questions[existingIdx] = savedRow;
    } else {
      store.questions.push(savedRow);
    }
    saveD1Store(store);

    return res.status(201).json({
      success: true,
      question: formatD1QuestionForClient(savedRow, true),
      mathValidationErrors: mathResult.errors,
    });
  });

  app.get('/api/questions/:id', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    const isAdmin = isStrictQuestionBankAdmin(user);
    const targetId = decodeURIComponent(String(req.params.id || '').trim());
    const store = loadD1Store();
    const questions = Array.isArray(store.questions) ? store.questions : [];
    const row = questions.find((q) => q.id === targetId);

    if (!row || (!isAdmin && row.status !== 'published')) {
      return res.status(404).json({ error: 'Question not found.' });
    }
    return res.status(200).json({
      question: formatD1QuestionForClient(row, isAdmin),
    });
  });

  const handleUpdateSingleQuestion = async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!isStrictQuestionBankAdmin(user)) {
      return res.status(user ? 403 : 401).json({
        error: 'Forbidden: Only shsvirtualadmin@gmail.com can update questions.',
      });
    }

    const targetId = decodeURIComponent(String(req.params.id || '').trim());
    const store = loadD1Store();
    if (!Array.isArray(store.questions)) store.questions = [];
    const idx = store.questions.findIndex((q) => q.id === targetId);
    if (idx === -1) {
      return res.status(404).json({ error: 'Question not found.' });
    }

    const existing = store.questions[idx];
    const body = req.body || {};

    const bankId = String(body.bank_id ?? body.sourceId ?? existing.bank_id ?? 'legacy').trim();
    const subject =
      body.subject !== undefined ? normalizeQSubject(body.subject) : String(existing.subject);
    const topic = body.topic !== undefined ? String(body.topic).trim() : String(existing.topic);
    const difficultyRaw =
      body.difficulty !== undefined
        ? String(body.difficulty).trim().toLowerCase()
        : String(existing.difficulty || 'medium');
    const difficulty = ['easy', 'medium', 'hard'].includes(difficultyRaw) ? difficultyRaw : 'medium';
    const statusRaw =
      body.status !== undefined
        ? String(body.status).trim().toLowerCase()
        : String(existing.status || 'published');
    const status = ['published', 'draft', 'archived'].includes(statusRaw) ? statusRaw : 'published';

    const rawQuestionText =
      body.question_text !== undefined || body.questionText !== undefined
        ? String(body.question_text ?? body.questionText ?? '').trim()
        : String(existing.question_text || '');

    let rawOptions: string[] = [];
    if (Array.isArray(body.options)) {
      rawOptions = body.options.map((o: any) => String(o ?? ''));
    } else if (typeof body.options_json === 'string') {
      try {
        const parsed = JSON.parse(body.options_json);
        if (Array.isArray(parsed)) rawOptions = parsed.map((o: any) => String(o ?? ''));
      } catch {
        rawOptions = [];
      }
    } else {
      try {
        const parsed = JSON.parse(existing.options_json || '[]');
        if (Array.isArray(parsed)) rawOptions = parsed.map((o: any) => String(o ?? ''));
      } catch {
        rawOptions = [];
      }
    }

    const rawExplanation =
      body.explanation !== undefined ? String(body.explanation).trim() : String(existing.explanation || '');
    const correctAnswer =
      body.correct_answer !== undefined || body.correctAnswer !== undefined
        ? Number(body.correct_answer ?? body.correctAnswer ?? 0)
        : Number(existing.correct_answer ?? 0);

    const mathResult = validateAndNormalizeQuestionMath({
      questionText: rawQuestionText,
      options: rawOptions,
      explanation: rawExplanation,
    });

    const needsReview =
      body.needs_review !== undefined || body.needsReview !== undefined
        ? Number(Boolean(body.needs_review ?? body.needsReview))
        : mathResult.needsReview
          ? 1
          : 0;

    const updatedRow: D1QuestionRow = {
      ...existing,
      bank_id: bankId,
      subject,
      topic,
      difficulty,
      status,
      needs_review: needsReview,
      question_text: mathResult.questionText,
      options_json: JSON.stringify(mathResult.options),
      correct_answer: Number.isFinite(correctAnswer) ? correctAnswer : 0,
      explanation: mathResult.explanation,
      updated_at: Date.now(),
    };

    store.questions[idx] = updatedRow;
    saveD1Store(store);

    return res.status(200).json({
      success: true,
      question: formatD1QuestionForClient(updatedRow, true),
      mathValidationErrors: mathResult.errors,
    });
  };

  app.put('/api/questions/:id', handleUpdateSingleQuestion);
  app.patch('/api/questions/:id', handleUpdateSingleQuestion);

  app.delete('/api/questions/:id', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!isStrictQuestionBankAdmin(user)) {
      return res.status(user ? 403 : 401).json({
        error: 'Forbidden: Only shsvirtualadmin@gmail.com can delete questions.',
      });
    }

    const targetId = decodeURIComponent(String(req.params.id || '').trim());
    const store = loadD1Store();
    if (!Array.isArray(store.questions)) store.questions = [];
    const beforeLen = store.questions.length;
    store.questions = store.questions.filter((q) => q.id !== targetId);
    if (store.questions.length === beforeLen) {
      return res.status(404).json({ error: 'Question not found.' });
    }
    saveD1Store(store);

    return res.status(200).json({
      success: true,
      deletedId: targetId,
    });
  });

  // ===========================================================================
  // /api/universities & /api/mcqs — D1 University-Based Admin Question Bank
  // ===========================================================================
  const isAdminOrSuperadmin = (user: VerifiedFirebaseUser | null, store: D1StoreData): boolean => {
    if (!user) return false;
    if (SUPERADMIN_UIDS.has(user.uid) || user.role === 'superadmin' || user.role === 'admin') {
      return true;
    }
    const roleRow = (store.userRoles || []).find((r) => r.uid === user.uid);
    if (roleRow && (roleRow.role === 'admin' || roleRow.role === 'superadmin' || roleRow.role === 'super_admin')) {
      return true;
    }
    return false;
  };

  const recalculateUniversityMcqCount = (store: D1StoreData, universityId?: string) => {
    if (!Array.isArray(store.universities)) store.universities = [];
    if (!Array.isArray(store.mcqs)) store.mcqs = [];
    if (universityId) {
      const uni = store.universities.find((u) => u.id === universityId);
      if (uni) {
        const cnt = store.mcqs.filter((m) => m.university_id === universityId).length;
        uni.mcq_count = cnt;
        uni.is_live = cnt > 0 ? 1 : 0;
      }
      return;
    }
    const countMap = new Map<string, number>();
    for (const m of store.mcqs) {
      countMap.set(m.university_id, (countMap.get(m.university_id) || 0) + 1);
    }
    for (const u of store.universities) {
      const cnt = countMap.get(u.id) || 0;
      u.mcq_count = cnt;
      u.is_live = cnt > 0 ? 1 : 0;
    }
  };

  // GET /api/universities — Public list of universities ordered by sort_order ASC, name ASC
  app.get('/api/universities', (_req: Request, res: Response) => {
    const store = loadD1Store();
    recalculateUniversityMcqCount(store);
    const universities = [...(store.universities || [])].sort(
      (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0) || a.name.localeCompare(b.name)
    );
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({
      success: true,
      universities,
    });
  });

  // POST /api/universities — Admin/Superadmin: Create new university
  app.post('/api/universities', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    const store = loadD1Store();
    if (!isAdminOrSuperadmin(user, store)) {
      return res.status(user ? 403 : 401).json({
        success: false,
        error: 'Forbidden: Only admin and superadmin can manage universities.',
      });
    }
    if (!checkWriteRateLimit(`uni_write:${user!.uid}`, 60, 60 * 1000)) {
      return res.status(429).json({ success: false, error: 'Rate limit exceeded. Try again shortly.' });
    }

    const body = req.body || {};
    const name = String(body.name || '').trim().slice(0, 120);
    if (!name) {
      return res.status(400).json({ success: false, error: 'University name is required.' });
    }

    const slug = buildUniversitySlug(String(body.slug || name));
    if (!Array.isArray(store.universities)) store.universities = [];
    if (store.universities.some((u) => u.slug.toLowerCase() === slug.toLowerCase())) {
      return res.status(409).json({
        success: false,
        error: `A university with slug "${slug}" already exists.`,
      });
    }

    const maxSort = store.universities.reduce((max, u) => Math.max(max, Number(u.sort_order || 0)), 0);
    const newUni: D1UniversityRow = {
      id: String(body.id || `uni_${slug.replace(/-/g, '_')}_${crypto.randomUUID().slice(0, 6)}`),
      name,
      slug,
      logo_url: String(body.logo_url || '').trim(),
      sort_order: Number.isFinite(Number(body.sort_order)) ? Number(body.sort_order) : maxSort + 1,
      mcq_count: 0,
      is_live: 0,
      created_at: new Date().toISOString(),
    };

    store.universities.push(newUni);
    saveD1Store(store);

    return res.status(201).json({
      success: true,
      university: newUni,
    });
  });

  // POST /api/universities/reorder — Admin/Superadmin: Reorder universities
  app.post('/api/universities/reorder', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    const store = loadD1Store();
    if (!isAdminOrSuperadmin(user, store)) {
      return res.status(user ? 403 : 401).json({
        success: false,
        error: 'Forbidden: Only admin and superadmin can reorder universities.',
      });
    }

    const orderedIds = Array.isArray(req.body?.orderedIds) ? req.body.orderedIds.map(String) : [];
    if (orderedIds.length === 0) {
      return res.status(400).json({ success: false, error: 'orderedIds array is required.' });
    }

    if (!Array.isArray(store.universities)) store.universities = [];
    orderedIds.forEach((id: string, index: number) => {
      const uni = store.universities!.find((u) => u.id === id || u.slug === id);
      if (uni) {
        uni.sort_order = index + 1;
      }
    });
    saveD1Store(store);

    const universities = [...store.universities].sort(
      (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0) || a.name.localeCompare(b.name)
    );
    return res.status(200).json({ success: true, universities });
  });

  // PUT & PATCH /api/universities/:id — Admin/Superadmin: Rename or update university
  const handleUpdateUniversity = async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    const store = loadD1Store();
    if (!isAdminOrSuperadmin(user, store)) {
      return res.status(user ? 403 : 401).json({
        success: false,
        error: 'Forbidden: Only admin and superadmin can edit universities.',
      });
    }

    const targetId = decodeURIComponent(String(req.params.id || '').trim());
    if (!Array.isArray(store.universities)) store.universities = [];
    const uni = store.universities.find((u) => u.id === targetId || u.slug === targetId);
    if (!uni) {
      return res.status(404).json({ success: false, error: 'University not found.' });
    }

    const body = req.body || {};
    if (body.name !== undefined) {
      const cleanName = String(body.name || '').trim().slice(0, 120);
      if (!cleanName) {
        return res.status(400).json({ success: false, error: 'University name cannot be empty.' });
      }
      uni.name = cleanName;
    }
    if (body.slug !== undefined) {
      const nextSlug = buildUniversitySlug(String(body.slug));
      const conflict = store.universities.some(
        (u) => u.id !== uni.id && u.slug.toLowerCase() === nextSlug.toLowerCase()
      );
      if (conflict) {
        return res.status(409).json({ success: false, error: `Slug "${nextSlug}" is already in use.` });
      }
      uni.slug = nextSlug;
    }
    if (body.logo_url !== undefined) {
      uni.logo_url = String(body.logo_url || '').trim();
    }
    if (body.sort_order !== undefined && Number.isFinite(Number(body.sort_order))) {
      uni.sort_order = Number(body.sort_order);
    }

    recalculateUniversityMcqCount(store, uni.id);
    saveD1Store(store);

    return res.status(200).json({ success: true, university: uni });
  };

  app.put('/api/universities/:id', handleUpdateUniversity);
  app.patch('/api/universities/:id', handleUpdateUniversity);

  // DELETE /api/universities/:id — Admin/Superadmin: Delete university and its MCQs
  app.delete('/api/universities/:id', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    const store = loadD1Store();
    if (!isAdminOrSuperadmin(user, store)) {
      return res.status(user ? 403 : 401).json({
        success: false,
        error: 'Forbidden: Only admin and superadmin can delete universities.',
      });
    }

    const targetId = decodeURIComponent(String(req.params.id || '').trim());
    if (!Array.isArray(store.universities)) store.universities = [];
    if (!Array.isArray(store.mcqs)) store.mcqs = [];

    const uni = store.universities.find((u) => u.id === targetId || u.slug === targetId);
    if (!uni) {
      return res.status(404).json({ success: false, error: 'University not found.' });
    }

    const deletedMcqs = store.mcqs.filter((m) => m.university_id === uni.id).length;
    store.mcqs = store.mcqs.filter((m) => m.university_id !== uni.id);
    store.universities = store.universities.filter((u) => u.id !== uni.id);
    saveD1Store(store);

    return res.status(200).json({
      success: true,
      deletedUniversityId: uni.id,
      deletedMcqs,
    });
  });

  // GET /api/mcqs/topics — Subject & Topic tree with counts for a university
  app.get('/api/mcqs/topics', (req: Request, res: Response) => {
    const store = loadD1Store();
    const uniParam = String(req.query.university_id || req.query.university_slug || '').trim();
    const universities = store.universities || [];
    const matchedUni = uniParam
      ? universities.find(
          (u) => u.id === uniParam || u.slug.toLowerCase() === uniParam.toLowerCase() || u.name.toLowerCase() === uniParam.toLowerCase()
        )
      : null;

    const mcqs = (store.mcqs || []).filter((m) =>
      matchedUni ? m.university_id === matchedUni.id : !uniParam
    );

    const subjectsMap = new Map<string, { subject: string; count: number; topics: Map<string, number> }>();
    const flat: Array<{ subject: string; topic: string; count: number }> = [];
    for (const m of mcqs) {
      const sub = String(m.subject || 'General').trim();
      const top = String(m.topic || 'General').trim();
      if (!subjectsMap.has(sub)) {
        subjectsMap.set(sub, { subject: sub, count: 0, topics: new Map() });
      }
      const entry = subjectsMap.get(sub)!;
      entry.count += 1;
      entry.topics.set(top, (entry.topics.get(top) || 0) + 1);
    }

    const subjects = Array.from(subjectsMap.values())
      .sort((a, b) => b.count - a.count || a.subject.localeCompare(b.subject))
      .map((s) => {
        const topicsArr = Array.from(s.topics.entries())
          .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
          .map(([topic, count]) => {
            flat.push({ subject: s.subject, topic, count });
            return { topic, count };
          });
        return {
          subject: s.subject,
          total: s.count,
          count: s.count,
          topics: topicsArr,
        };
      });

    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({
      success: true,
      universityId: matchedUni?.id || null,
      totalMcqs: mcqs.length,
      subjects,
      flat,
    });
  });

  const computeBankHealthIntegrity = (store: D1StoreData): D1BankHealthIntegrityReport => {
    const universities = store.universities || [];
    const mcqs = store.mcqs || [];
    const uniById = new Map<string, D1UniversityRow>();
    const slugCounts = new Map<string, number>();

    for (const u of universities) {
      uniById.set(u.id, u);
      const s = String(u.slug || '').toLowerCase();
      slugCounts.set(s, (slugCounts.get(s) || 0) + 1);
    }

    const duplicateSlugs = Array.from(slugCounts.entries())
      .filter(([, cnt]) => cnt > 1)
      .map(([slug]) => slug);

    let missingOrInvalidUniversityIdCount = 0;
    let slugMismatchCount = 0;
    const actualCountMap = new Map<string, number>();

    for (const m of mcqs) {
      const u = uniById.get(m.university_id);
      if (!m.university_id || !u) {
        missingOrInvalidUniversityIdCount++;
      } else {
        actualCountMap.set(u.id, (actualCountMap.get(u.id) || 0) + 1);
        if (!m.university_slug || m.university_slug !== u.slug) {
          slugMismatchCount++;
        }
      }
    }

    const countMismatchUniversities: Array<{
      id: string;
      name: string;
      slug: string;
      stored_count: number;
      actual_count: number;
    }> = [];

    for (const u of universities) {
      const actual = actualCountMap.get(u.id) || 0;
      const stored = Number(u.mcq_count || 0);
      if (stored !== actual) {
        countMismatchUniversities.push({
          id: u.id,
          name: u.name,
          slug: u.slug,
          stored_count: stored,
          actual_count: actual,
        });
      }
    }

    const isHealthy =
      missingOrInvalidUniversityIdCount === 0 &&
      slugMismatchCount === 0 &&
      duplicateSlugs.length === 0 &&
      countMismatchUniversities.length === 0;

    return {
      isHealthy,
      missingOrInvalidUniversityIdCount,
      slugMismatchCount,
      duplicateSlugs,
      countMismatchUniversities,
    };
  };

  // GET /api/mcqs/health — D1 Bank Health diagnostics
  app.get('/api/mcqs/health', (_req: Request, res: Response) => {
    const store = loadD1Store();
    const integrity = computeBankHealthIntegrity(store);
    recalculateUniversityMcqCount(store);
    const universities = [...(store.universities || [])].sort(
      (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0)
    );
    const mcqs = store.mcqs || [];
    const reports = store.mcqReports || [];

    const bySubject: Record<string, number> = {};
    const byDifficulty: Record<string, number> = { easy: 0, medium: 0, hard: 0 };
    let missingExplanationCount = 0;

    for (const m of mcqs) {
      bySubject[m.subject] = (bySubject[m.subject] || 0) + 1;
      const diff = String(m.difficulty || 'medium').toLowerCase();
      byDifficulty[diff] = (byDifficulty[diff] || 0) + 1;
      if (!String(m.explanation || '').trim()) {
        missingExplanationCount++;
      }
    }

    const openReportsCount = reports.filter((r) => r.status === 'open').length;

    return res.status(200).json({
      success: true,
      source: 'cloudflare-d1',
      totalUniversities: universities.length,
      liveUniversities: universities.filter((u) => u.mcq_count > 0).length,
      comingSoonUniversities: universities.filter((u) => u.mcq_count === 0).length,
      totalMcqs: mcqs.length,
      missingExplanations: missingExplanationCount,
      missingExplanationCount,
      openReports: openReportsCount,
      openReportsCount,
      bySubject,
      byDifficulty,
      byUniversity: universities,
      universities,
      integrity,
      imports: store.imports || [],
    });
  });

  // POST /api/mcqs/health/fix — Repair integrity issues (slug mismatch, count drift, orphan MCQs)
  app.post('/api/mcqs/health/fix', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    const store = loadD1Store();
    if (!isAdminOrSuperadmin(user, store)) {
      return res.status(user ? 403 : 401).json({
        success: false,
        error: 'Forbidden: Only admin and superadmin can run bank integrity repairs.',
      });
    }

    const issueType = String(req.body?.issueType || 'all').trim();
    const targetUniId = String(req.body?.targetUniversityId || '').trim();
    const universities = store.universities || [];
    const mcqs = store.mcqs || [];
    const uniById = new Map(universities.map((u) => [u.id, u]));
    const uniBySlug = new Map(universities.map((u) => [u.slug.toLowerCase(), u]));
    let fixedCount = 0;

    if (issueType === 'all' || issueType === 'slug_mismatch') {
      for (const m of mcqs) {
        const u = uniById.get(m.university_id);
        if (u && m.university_slug !== u.slug) {
          m.university_slug = u.slug;
          fixedCount++;
        }
      }
    }

    if (issueType === 'all' || issueType === 'orphan_mcqs') {
      const fallbackUni =
        (targetUniId ? uniById.get(targetUniId) : undefined) ||
        universities.find((u) => u.slug === 'fast-nuces') ||
        universities[0];
      for (const m of mcqs) {
        if (!uniById.has(m.university_id)) {
          const bySlug = m.university_slug ? uniBySlug.get(m.university_slug.toLowerCase()) : undefined;
          const resolved = bySlug || fallbackUni;
          if (resolved) {
            m.university_id = resolved.id;
            m.university_slug = resolved.slug;
            fixedCount++;
          }
        }
      }
    }

    if (issueType === 'all' || issueType === 'count_drift') {
      recalculateUniversityMcqCount(store);
      fixedCount++;
    }

    saveD1Store(store);
    const integrity = computeBankHealthIntegrity(store);
    return res.status(200).json({
      success: true,
      fixedCount,
      integrity,
    });
  });

  // GET /api/mcqs/export — Downloadable JSON or CSV backup of D1 MCQs
  app.get('/api/mcqs/export', (req: Request, res: Response) => {
    const store = loadD1Store();
    const format = String(req.query.format || 'json').toLowerCase() === 'csv' ? 'csv' : 'json';
    const uniFilter = String(req.query.university_id || '').trim();
    const universities = store.universities || [];
    const uniById = new Map(universities.map((u) => [u.id, u]));

    const rows = (store.mcqs || [])
      .filter((m) => !uniFilter || uniFilter === 'all' || m.university_id === uniFilter)
      .map((m) => ({
        id: m.id,
        university_id: m.university_id,
        university_slug: m.university_slug || uniById.get(m.university_id)?.slug || '',
        import_batch_id: m.import_batch_id || '',
        subject: m.subject,
        topic: m.topic,
        question: m.question,
        option_a: m.option_a,
        option_b: m.option_b,
        option_c: m.option_c,
        option_d: m.option_d,
        correct_answer: m.correct_answer,
        explanation: m.explanation || '',
        difficulty: m.difficulty || 'medium',
        created_at: m.created_at,
      }));

    if (format === 'csv') {
      const headers = [
        'id',
        'university_id',
        'university_slug',
        'import_batch_id',
        'subject',
        'topic',
        'question',
        'option_a',
        'option_b',
        'option_c',
        'option_d',
        'correct_answer',
        'explanation',
        'difficulty',
        'created_at',
      ];
      const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const csv = [
        headers.join(','),
        ...rows.map((r) => headers.map((h) => esc((r as Record<string, unknown>)[h])).join(',')),
      ].join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="boardly_university_mcqs_backup.csv"');
      return res.end(csv);
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="boardly_university_mcqs_backup.json"');
    return res.end(
      JSON.stringify(
        {
          exported_at: new Date().toISOString(),
          total_universities: universities.length,
          total_mcqs: rows.length,
          universities,
          mcqs: rows,
        },
        null,
        2
      )
    );
  });

  // POST /api/mcqs/move — Transactional move of selected MCQs between universities
  const handleMoveMcqs = async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    const store = loadD1Store();
    if (!isAdminOrSuperadmin(user, store)) {
      return res.status(user ? 403 : 401).json({
        success: false,
        error: 'Forbidden: Only admin and superadmin can move MCQs between universities.',
      });
    }

    const body = req.body || {};
    const toUniId = String(body.to_university_id || body.toUniversityId || body.university_id || '').trim();
    const fromUniId = String(body.from_university_id || body.fromUniversityId || '').trim();
    const ids: string[] = Array.isArray(body.mcq_ids || body.ids)
      ? (body.mcq_ids || body.ids).map((id: unknown) => String(id || '').trim()).filter(Boolean)
      : [];

    if (!toUniId) {
      return res.status(400).json({ success: false, error: 'Target university_id is required.' });
    }
    if (ids.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one MCQ ID is required to move.' });
    }

    const universities = store.universities || [];
    const targetUni = universities.find((u) => u.id === toUniId || u.slug === toUniId);
    if (!targetUni) {
      return res.status(404).json({ success: false, error: 'Target university not found.' });
    }

    const idSet = new Set(ids);
    const affectedUniIds = new Set<string>([targetUni.id]);
    if (fromUniId) affectedUniIds.add(fromUniId);

    let movedCount = 0;
    for (const m of store.mcqs || []) {
      if (!idSet.has(m.id)) continue;
      if (fromUniId && m.university_id !== fromUniId) continue;
      affectedUniIds.add(m.university_id);
      m.university_id = targetUni.id;
      m.university_slug = targetUni.slug;
      movedCount++;
    }

    for (const uId of affectedUniIds) {
      recalculateUniversityMcqCount(store, uId);
    }
    saveD1Store(store);

    return res.status(200).json({
      success: true,
      movedCount,
      toUniversityId: targetUni.id,
      toUniversitySlug: targetUni.slug,
      toUniversityName: targetUni.name,
    });
  };

  app.post('/api/mcqs/move', handleMoveMcqs);
  app.post('/api/mcqs/repair-move', handleMoveMcqs);

  // GET /api/mcqs/reports & POST /api/mcqs/reports & PATCH /api/mcqs/reports/:id
  app.get('/api/mcqs/reports', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    const store = loadD1Store();
    if (!isAdminOrSuperadmin(user, store)) {
      return res.status(user ? 403 : 401).json({
        success: false,
        error: 'Forbidden: Only admin and superadmin can view MCQ reports.',
      });
    }
    const statusFilter = String(req.query.status || '').trim().toLowerCase();
    const reports = [...(store.mcqReports || [])]
      .filter((r) => !statusFilter || statusFilter === 'all' || r.status === statusFilter)
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
      .map((r) => ({
        ...r,
        question: r.question || r.question_preview || '',
        details: r.details || r.comment || '',
      }));

    return res.status(200).json({ success: true, reports });
  });

  app.post('/api/mcqs/reports', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req).catch(() => null);
    const body = req.body || {};
    const mcqId = String(body.mcq_id || body.questionId || '').trim();
    if (!mcqId) {
      return res.status(400).json({ success: false, error: 'mcq_id is required.' });
    }

    const store = loadD1Store();
    if (!Array.isArray(store.mcqReports)) store.mcqReports = [];
    const mcq = (store.mcqs || []).find((m) => m.id === mcqId);

    const preview = mcq?.question?.slice(0, 180) || String(body.question_preview || body.question || '');
    const commentText = String(body.comment || body.details || '').trim();
    const newReport: D1McqReportRow = {
      id: `mcqrep_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`,
      mcq_id: mcqId,
      university_id: mcq?.university_id || String(body.university_id || ''),
      subject: mcq?.subject || String(body.subject || ''),
      topic: mcq?.topic || String(body.topic || ''),
      question_preview: preview,
      question: preview,
      reason: String(body.reason || 'wrong_key').trim(),
      comment: commentText,
      details: commentText,
      user_id: user?.uid || String(body.user_id || body.userId || 'student'),
      user_email: user?.email || String(body.user_email || body.userEmail || ''),
      status: 'open',
      created_at: new Date().toISOString(),
    };

    store.mcqReports.unshift(newReport);
    saveD1Store(store);

    return res.status(201).json({ success: true, report: newReport });
  });

  app.patch('/api/mcqs/reports/:id', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    const store = loadD1Store();
    if (!isAdminOrSuperadmin(user, store)) {
      return res.status(user ? 403 : 401).json({
        success: false,
        error: 'Forbidden: Only admin and superadmin can update MCQ reports.',
      });
    }
    const reportId = decodeURIComponent(String(req.params.id || '').trim());
    const rep = (store.mcqReports || []).find((r) => r.id === reportId);
    if (!rep) {
      return res.status(404).json({ success: false, error: 'Report not found.' });
    }
    const nextStatus = String(req.body?.status || 'resolved').toLowerCase();
    if (nextStatus === 'open' || nextStatus === 'resolved' || nextStatus === 'ignored') {
      rep.status = nextStatus;
    }
    saveD1Store(store);
    return res.status(200).json({ success: true, report: rep });
  });

  // POST /api/mcqs/verify — Grade student answers against D1 mcqs table
  app.post('/api/mcqs/verify', (req: Request, res: Response) => {
    const body = req.body || {};
    const store = loadD1Store();
    const mcqs = store.mcqs || [];
    const mcqMap = new Map<string, D1McqRow>();
    for (const m of mcqs) {
      mcqMap.set(m.id, m);
    }

    const letterToIdx: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };

    if (Array.isArray(body.questionIds) && !Array.isArray(body.answers)) {
      const results: Record<
        string,
        {
          correct_answer: 'A' | 'B' | 'C' | 'D';
          correct_index: number;
          explanation: string;
        }
      > = {};
      for (const rawId of body.questionIds) {
        const qId = String(rawId || '').trim();
        const row = mcqMap.get(qId);
        if (!row) continue;
        const letter = (String(row.correct_answer || 'A').toUpperCase() as 'A' | 'B' | 'C' | 'D');
        results[qId] = {
          correct_answer: letter,
          correct_index: letterToIdx[letter] ?? 0,
          explanation: row.explanation || '',
        };
      }
      return res.status(200).json({ success: true, verified: true, results });
    }

    if (Array.isArray(body.answers)) {
      const results: Record<string, any> = {};
      for (const item of body.answers) {
        const qId = String(item?.questionId || item?.id || '').trim();
        const row = mcqMap.get(qId);
        if (!row) continue;

        const canonicalIdx = letterToIdx[String(row.correct_answer || 'A').toUpperCase()] ?? 0;
        const canonicalOptions = [row.option_a, row.option_b, row.option_c, row.option_d];
        const canonicalCorrectText = canonicalOptions[canonicalIdx] || row.option_a;

        let resolvedIdx = canonicalIdx;
        if (Array.isArray(item.displayedOptions) && item.displayedOptions.length > 0) {
          const mIdx = item.displayedOptions.findIndex(
            (opt: any) => String(opt ?? '').trim() === String(canonicalCorrectText).trim()
          );
          if (mIdx !== -1) resolvedIdx = mIdx;
        }

        const selected =
          item.selectedAnswer === null || item.selectedAnswer === undefined
            ? null
            : Number(item.selectedAnswer);
        const isCorrect = selected !== null && Number.isFinite(selected) && selected === resolvedIdx;

        results[qId] = {
          questionId: qId,
          selectedAnswer: selected,
          correct_answer: resolvedIdx,
          correctAnswer: resolvedIdx,
          correct_letter: row.correct_answer,
          canonical_correct_answer: canonicalIdx,
          isCorrect,
          explanation: row.explanation || '',
        };
      }
      return res.status(200).json({ success: true, verified: true, results });
    }

    return res.status(400).json({ success: false, error: 'answers or questionIds array is required.' });
  });

  // POST /api/mcqs/import-chunk — Admin/Superadmin: Unlimited chunked bulk MCQ import
  app.post('/api/mcqs/import-chunk', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    const store = loadD1Store();
    if (!isAdminOrSuperadmin(user, store)) {
      return res.status(user ? 403 : 401).json({
        success: false,
        error: 'Forbidden: Only admin and superadmin can import MCQs.',
      });
    }

    const body = req.body || {};
    const universityIdOrSlug = String(body.university_id || body.universityId || '').trim();
    const defaultSubject = String(body.default_subject || body.subject || '').trim();
    const defaultTopic = String(body.default_topic || body.topic || '').trim();
    const chunkOffset = Math.max(0, Number(body.chunk_offset ?? body.chunkOffset ?? 0));
    const importBatchId = String(body.import_batch_id || body.importBatchId || `imp_${Date.now()}`).trim();
    const rawRows = Array.isArray(body.rows) ? body.rows : [];

    if (!universityIdOrSlug) {
      return res.status(400).json({ success: false, error: 'university_id is required for import.' });
    }

    if (!Array.isArray(store.universities)) store.universities = [];
    if (!Array.isArray(store.mcqs)) store.mcqs = [];
    if (!Array.isArray(store.imports)) store.imports = [];

    const uni = store.universities.find(
      (u) => u.id === universityIdOrSlug || u.slug === universityIdOrSlug.toLowerCase()
    );
    if (!uni) {
      return res.status(404).json({ success: false, error: 'Target university not found in D1.' });
    }

    const rowErrors: Array<{ rowNumber: number; reason: string; row: number; message: string }> = [];
    let importedCount = 0;
    const nowIso = new Date().toISOString();

    for (let i = 0; i < rawRows.length; i++) {
      const rowNum = chunkOffset + i + 1;
      const r = rawRows[i] || {};

      const subject = String(r.subject || defaultSubject || '').trim();
      const topic = String(r.topic || r.chapter || defaultTopic || 'General').trim();
      const question = String(r.question || r.question_text || r.q || r.stem || '').trim();

      let optA = String(r.option_a ?? r.optionA ?? r.a ?? '').trim();
      let optB = String(r.option_b ?? r.optionB ?? r.b ?? '').trim();
      let optC = String(r.option_c ?? r.optionC ?? r.c ?? '').trim();
      let optD = String(r.option_d ?? r.optionD ?? r.d ?? '').trim();

      if ((!optA || !optB) && Array.isArray(r.options) && r.options.length >= 4) {
        optA = String(r.options[0] ?? '').trim();
        optB = String(r.options[1] ?? '').trim();
        optC = String(r.options[2] ?? '').trim();
        optD = String(r.options[3] ?? '').trim();
      }

      if (!subject) {
        const msg = 'Missing subject';
        rowErrors.push({ rowNumber: rowNum, reason: msg, row: rowNum, message: msg });
        continue;
      }
      if (!question) {
        const msg = 'Missing question text';
        rowErrors.push({ rowNumber: rowNum, reason: msg, row: rowNum, message: msg });
        continue;
      }
      if (!optA || !optB || !optC || !optD) {
        const msg = 'All 4 options (A, B, C, D) are required';
        rowErrors.push({ rowNumber: rowNum, reason: msg, row: rowNum, message: msg });
        continue;
      }

      const correctLetter = normalizeCorrectLetter(
        r.correct_answer ?? r.correctAnswer ?? r.correct ?? r.answer,
        { a: optA, b: optB, c: optC, d: optD }
      );
      if (!correctLetter) {
        const msg = `Invalid correct_answer "${String(r.correct_answer ?? r.correct ?? '')}" (must be A/B/C/D or match an option)`;
        rowErrors.push({ rowNumber: rowNum, reason: msg, row: rowNum, message: msg });
        continue;
      }

      const rawDiff = String(r.difficulty || 'medium').trim().toLowerCase();
      const difficulty: 'easy' | 'medium' | 'hard' =
        rawDiff === 'easy' || rawDiff === 'hard' ? rawDiff : 'medium';
      const explanation = String(r.explanation ?? r.explain ?? '').trim();

      const rawId = String(r.id || `mcq_${uni.slug}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`).trim();
      const existingIdx = store.mcqs.findIndex((m) => m.id === rawId);
      // Never overwrite an MCQ belonging to a different university
      const safeId =
        existingIdx !== -1 && store.mcqs[existingIdx].university_id !== uni.id
          ? `mcq_${uni.slug}_${rawId}`
          : rawId;

      const newMcq: D1McqRow = {
        id: safeId,
        university_id: uni.id,
        university_slug: uni.slug,
        import_batch_id: importBatchId,
        subject,
        topic: topic || 'General',
        question,
        option_a: optA,
        option_b: optB,
        option_c: optC,
        option_d: optD,
        correct_answer: correctLetter,
        explanation,
        difficulty,
        created_at: nowIso,
      };

      const targetIdx = store.mcqs.findIndex((m) => m.id === safeId && m.university_id === uni.id);
      if (targetIdx !== -1) {
        store.mcqs[targetIdx] = newMcq;
      } else {
        store.mcqs.push(newMcq);
      }
      importedCount++;
    }

    recalculateUniversityMcqCount(store, uni.id);
    saveD1Store(store);

    return res.status(200).json({
      success: true,
      universityId: uni.id,
      universitySlug: uni.slug,
      imported: importedCount,
      importedCount,
      failed: rowErrors.length,
      skippedCount: rowErrors.length,
      errors: rowErrors.map((e) => ({ row: e.row, message: e.message })),
      rowErrors,
      universityMcqCount: uni.mcq_count,
      universityIsLive: Boolean(uni.is_live),
    });
  });

  // POST /api/mcqs/bulk-delete — Admin/Superadmin: Delete selected MCQs or by university/subject/topic
  app.post('/api/mcqs/bulk-delete', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    const store = loadD1Store();
    if (!isAdminOrSuperadmin(user, store)) {
      return res.status(user ? 403 : 401).json({
        success: false,
        error: 'Forbidden: Only admin and superadmin can delete MCQs.',
      });
    }

    const body = req.body || {};
    if (!Array.isArray(store.mcqs)) store.mcqs = [];
    const beforeCount = store.mcqs.length;

    if (Array.isArray(body.ids) && body.ids.length > 0) {
      const idSet = new Set(body.ids.map((id: any) => String(id).trim()));
      store.mcqs = store.mcqs.filter((m) => !idSet.has(m.id));
    } else if (body.university_id) {
      const uniId = String(body.university_id).trim();
      const subj = String(body.subject || '').trim().toLowerCase();
      const top = String(body.topic || '').trim().toLowerCase();
      store.mcqs = store.mcqs.filter((m) => {
        if (m.university_id !== uniId) return true;
        if (subj && subj !== 'all' && m.subject.toLowerCase() !== subj) return true;
        if (top && top !== 'all' && m.topic.toLowerCase() !== top) return true;
        return false;
      });
    } else {
      return res.status(400).json({ success: false, error: 'Provide ids array or university_id filter.' });
    }

    const deletedCount = beforeCount - store.mcqs.length;
    recalculateUniversityMcqCount(store);
    saveD1Store(store);

    return res.status(200).json({
      success: true,
      deletedCount,
    });
  });

  // GET /api/mcqs — Query MCQs by university_id/slug, subject, topic, difficulty, search
  app.get('/api/mcqs', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req).catch(() => null);
    const store = loadD1Store();
    const isAdmin = isAdminOrSuperadmin(user, store);

    const uniParam = String(
      req.query.university_id || req.query.university_slug || req.query.university || ''
    ).trim();
    const subjectParam = String(req.query.subject || '').trim();
    const topicParam = String(req.query.topic || '').trim();
    const difficultyParam = String(req.query.difficulty || '').trim().toLowerCase();
    const searchParam = String(req.query.search || req.query.q || '').trim().toLowerCase();
    const idsParam = String(req.query.ids || '').trim();
    const excludeIdsParam = String(req.query.exclude_ids || '').trim();
    const isRandom = req.query.random === '1' || req.query.random === 'true';
    const includeAnswers = isAdmin || req.query.practice === '1' || req.query.include_answers === '1';

    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '50'), 10) || 50, 1), 500);
    const offset = Math.max(parseInt(String(req.query.offset || '0'), 10) || 0, 0);

    const universities = store.universities || [];
    let resolvedUniId = uniParam;
    if (uniParam && uniParam !== 'all') {
      const matched = universities.find(
        (u) => u.id === uniParam || u.slug.toLowerCase() === uniParam.toLowerCase()
      );
      if (matched) resolvedUniId = matched.id;
    }

    const requestedIds = idsParam
      ? new Set(idsParam.split(',').map((s) => s.trim()).filter(Boolean))
      : null;
    const excludedIds = excludeIdsParam
      ? new Set(excludeIdsParam.split(',').map((s) => s.trim()).filter(Boolean))
      : null;

    let matching = (store.mcqs || []).filter((m) => {
      if (requestedIds && !requestedIds.has(m.id)) return false;
      if (excludedIds && excludedIds.has(m.id)) return false;
      if (resolvedUniId && resolvedUniId !== 'all' && m.university_id !== resolvedUniId) return false;
      if (
        subjectParam &&
        subjectParam !== 'all' &&
        m.subject.toLowerCase() !== subjectParam.toLowerCase()
      ) {
        return false;
      }
      if (
        topicParam &&
        topicParam !== 'all' &&
        m.topic.toLowerCase() !== topicParam.toLowerCase()
      ) {
        return false;
      }
      if (
        difficultyParam &&
        difficultyParam !== 'all' &&
        m.difficulty.toLowerCase() !== difficultyParam
      ) {
        return false;
      }
      if (searchParam) {
        const hay = `${m.id} ${m.question} ${m.option_a} ${m.option_b} ${m.option_c} ${m.option_d} ${m.subject} ${m.topic}`.toLowerCase();
        if (!hay.includes(searchParam)) return false;
      }
      return true;
    });

    const total = matching.length;
    if (isRandom) {
      matching = [...matching];
      for (let i = matching.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [matching[i], matching[j]] = [matching[j], matching[i]];
      }
    } else {
      matching.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)) || a.id.localeCompare(b.id));
    }

    const paged = matching.slice(offset, offset + limit);
    const letterToIdx: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };

    const formatted = paged.map((rawMcq) => {
      const m = repairD1McqRow(rawMcq);
      const base: Record<string, any> = {
        id: m.id,
        university_id: m.university_id,
        university_slug: m.university_slug || '',
        import_batch_id: m.import_batch_id || '',
        subject: m.subject,
        topic: m.topic,
        question: m.question,
        option_a: m.option_a,
        option_b: m.option_b,
        option_c: m.option_c,
        option_d: m.option_d,
        options: [m.option_a, m.option_b, m.option_c, m.option_d],
        difficulty: m.difficulty,
        created_at: m.created_at,
      };
      if (includeAnswers) {
        base.correct_answer = m.correct_answer;
        base.correct_index = letterToIdx[m.correct_answer] ?? 0;
        base.explanation = m.explanation;
      }
      return base;
    });

    return res.status(200).json({
      success: true,
      mcqs: formatted,
      total,
      limit,
      offset,
      hasMore: offset + formatted.length < total,
    });
  });

  // POST /api/mcqs — Admin/Superadmin: Create single MCQ
  app.post('/api/mcqs', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    const store = loadD1Store();
    if (!isAdminOrSuperadmin(user, store)) {
      return res.status(user ? 403 : 401).json({
        success: false,
        error: 'Forbidden: Only admin and superadmin can add MCQs.',
      });
    }

    const body = req.body || {};
    const uniIdOrSlug = String(body.university_id || body.universityId || '').trim();
    const uni = (store.universities || []).find(
      (u) => u.id === uniIdOrSlug || u.slug.toLowerCase() === uniIdOrSlug.toLowerCase()
    );
    if (!uni) {
      return res.status(400).json({ success: false, error: 'Valid university_id is required.' });
    }

    const subject = String(body.subject || '').trim();
    const topic = String(body.topic || 'General').trim() || 'General';
    const question = String(body.question || '').trim();
    const optA = String(body.option_a ?? body.options?.[0] ?? '').trim();
    const optB = String(body.option_b ?? body.options?.[1] ?? '').trim();
    const optC = String(body.option_c ?? body.options?.[2] ?? '').trim();
    const optD = String(body.option_d ?? body.options?.[3] ?? '').trim();

    if (!subject || !question || !optA || !optB || !optC || !optD) {
      return res.status(400).json({
        success: false,
        error: 'University, subject, question, and all 4 options (A, B, C, D) are required.',
      });
    }

    const correctLetter = normalizeCorrectLetter(body.correct_answer ?? body.correctAnswer, {
      a: optA,
      b: optB,
      c: optC,
      d: optD,
    });
    if (!correctLetter) {
      return res.status(400).json({
        success: false,
        error: 'correct_answer must be A, B, C, or D.',
      });
    }

    const rawDiff = String(body.difficulty || 'medium').trim().toLowerCase();
    const difficulty: 'easy' | 'medium' | 'hard' =
      rawDiff === 'easy' || rawDiff === 'hard' ? rawDiff : 'medium';

    const newMcq: D1McqRow = {
      id: String(body.id || `mcq_${uni.slug}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`).trim(),
      university_id: uni.id,
      university_slug: uni.slug,
      import_batch_id: '',
      subject,
      topic,
      question,
      option_a: optA,
      option_b: optB,
      option_c: optC,
      option_d: optD,
      correct_answer: correctLetter,
      explanation: String(body.explanation || '').trim(),
      difficulty,
      created_at: new Date().toISOString(),
    };

    if (!Array.isArray(store.mcqs)) store.mcqs = [];
    store.mcqs.unshift(newMcq);
    recalculateUniversityMcqCount(store, uni.id);
    saveD1Store(store);

    return res.status(201).json({
      success: true,
      mcq: newMcq,
      universityMcqCount: uni.mcq_count,
      universityIsLive: Boolean(uni.is_live),
    });
  });

  // PUT & PATCH /api/mcqs/:id — Admin/Superadmin: Edit MCQ
  const handleUpdateMcq = async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    const store = loadD1Store();
    if (!isAdminOrSuperadmin(user, store)) {
      return res.status(user ? 403 : 401).json({
        success: false,
        error: 'Forbidden: Only admin and superadmin can edit MCQs.',
      });
    }

    const mcqId = decodeURIComponent(String(req.params.id || '').trim());
    if (!Array.isArray(store.mcqs)) store.mcqs = [];
    const mcq = store.mcqs.find((m) => m.id === mcqId);
    if (!mcq) {
      return res.status(404).json({ success: false, error: 'MCQ not found.' });
    }

    const prevUniId = mcq.university_id;
    const body = req.body || {};

    if (body.university_id !== undefined) {
      const targetUni = (store.universities || []).find(
        (u) => u.id === body.university_id || u.slug === body.university_id
      );
      if (targetUni) {
        mcq.university_id = targetUni.id;
        mcq.university_slug = targetUni.slug;
      }
    }
    if (body.subject !== undefined) mcq.subject = String(body.subject).trim() || mcq.subject;
    if (body.topic !== undefined) mcq.topic = String(body.topic).trim() || 'General';
    if (body.question !== undefined) mcq.question = String(body.question).trim() || mcq.question;
    if (body.option_a !== undefined) mcq.option_a = String(body.option_a).trim();
    if (body.option_b !== undefined) mcq.option_b = String(body.option_b).trim();
    if (body.option_c !== undefined) mcq.option_c = String(body.option_c).trim();
    if (body.option_d !== undefined) mcq.option_d = String(body.option_d).trim();
    if (body.explanation !== undefined) mcq.explanation = String(body.explanation).trim();
    if (body.difficulty !== undefined) {
      const d = String(body.difficulty).trim().toLowerCase();
      if (d === 'easy' || d === 'medium' || d === 'hard') mcq.difficulty = d;
    }
    if (body.correct_answer !== undefined) {
      const letter = normalizeCorrectLetter(body.correct_answer, {
        a: mcq.option_a,
        b: mcq.option_b,
        c: mcq.option_c,
        d: mcq.option_d,
      });
      if (letter) mcq.correct_answer = letter;
    }

    recalculateUniversityMcqCount(store, prevUniId);
    if (mcq.university_id !== prevUniId) {
      recalculateUniversityMcqCount(store, mcq.university_id);
    }
    saveD1Store(store);

    return res.status(200).json({ success: true, mcq });
  };

  app.put('/api/mcqs/:id', handleUpdateMcq);
  app.patch('/api/mcqs/:id', handleUpdateMcq);

  // DELETE /api/mcqs/:id — Admin/Superadmin: Delete single MCQ
  app.delete('/api/mcqs/:id', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    const store = loadD1Store();
    if (!isAdminOrSuperadmin(user, store)) {
      return res.status(user ? 403 : 401).json({
        success: false,
        error: 'Forbidden: Only admin and superadmin can delete MCQs.',
      });
    }

    const mcqId = decodeURIComponent(String(req.params.id || '').trim());
    if (!Array.isArray(store.mcqs)) store.mcqs = [];
    const existing = store.mcqs.find((m) => m.id === mcqId);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'MCQ not found.' });
    }

    const uniId = existing.university_id;
    store.mcqs = store.mcqs.filter((m) => m.id !== mcqId);
    recalculateUniversityMcqCount(store, uniId);
    saveD1Store(store);

    return res.status(200).json({
      success: true,
      deletedId: mcqId,
    });
  });

  // ── D1 Health Check ────────────────────────────────────────────────────────
  app.get('/api/health', (_req: Request, res: Response) => {
    return res.status(200).json({
      ok: true,
      service: 'boardly-d1-worker',
      timestamp: Date.now(),
    });
  });

  // ── D1 User Roles & Granular Admin Permissions ─────────────────────────────
  const ADMIN_DEFAULT_PERMISSIONS = new Set(['mcq.manage', 'content.delete']);

  const resolveD1Role = (
    store: any,
    user: { uid: string; email: string; isGuest?: boolean; username?: string; name?: string; role?: string }
  ) => {
    if (user.isGuest || String(user.uid || '').startsWith('guest_')) {
      return {
        uid: user.uid,
        email: '',
        role: 'student',
        custom_role: 'Guest',
        is_posting_banned: 0,
        updated_at: Date.now(),
      };
    }
    if (!Array.isArray(store.userRoles)) store.userRoles = [];
    let row = store.userRoles.find((r: any) => r.uid === user.uid);
    const isSuper =
      SUPERADMIN_UIDS.has(user.uid) ||
      Boolean(user.email && SUPERADMIN_EMAILS.has(user.email.toLowerCase()));
    const isExplicitLimitedAdmin =
      user.uid === 'uid_regular_admin' || /^reg_/i.test(user.uid);
    let unameRole: string | null = null;
    try {
      const localD1 = getSharedLocalD1Database();
      for (const u of localD1.tables.user_usernames.values()) {
        if (u.uid === user.uid && u.role) {
          unameRole = u.role;
          break;
        }
      }
    } catch {
      // Ignore if local D1 not initialized
    }
    if (!row) {
      row = {
        uid: user.uid,
        email: user.email,
        role: isSuper
          ? 'super_admin'
          : isExplicitLimitedAdmin
          ? 'admin'
          : unameRole === 'superadmin'
          ? 'super_admin'
          : unameRole || (user.role === 'admin' ? 'admin' : 'student'),
        custom_role: null,
        is_posting_banned: 0,
        updated_at: Date.now(),
      };
      store.userRoles.push(row);
      saveD1Store(store);
    } else if (isSuper && row.role !== 'super_admin') {
      row.role = 'super_admin';
      saveD1Store(store);
    } else if (row.role === 'superadmin') {
      row.role = 'super_admin';
      saveD1Store(store);
    }
    return row;
  };

  const hasAdminPermission = (
    store: any,
    user: { uid: string; email: string; role?: string } | null,
    permissionKey: string,
    options?: { targetId?: string; consumeOnce?: boolean }
  ): boolean => {
    if (!user) return false;
    const roleRow = resolveD1Role(store, user);
    const canonicalRole =
      roleRow.role === 'superadmin' || roleRow.role === 'super_admin' || SUPERADMIN_UIDS.has(user.uid)
        ? 'super_admin'
        : roleRow.role;

    if (canonicalRole === 'super_admin') {
      return true;
    }
    if (canonicalRole !== 'admin') {
      return false;
    }
    if (ADMIN_DEFAULT_PERMISSIONS.has(permissionKey)) {
      return true;
    }

    const nowMs = Date.now();
    if (!Array.isArray(store.accessGrants)) store.accessGrants = [];
    const targetId = options?.targetId ? String(options.targetId).trim() : '';
    const matchingGrant = store.accessGrants.find((g: any) => {
      if (g.adminUid !== user.uid) return false;
      if (g.permission !== permissionKey) return false;
      if (g.revokedAt) return false;
      if (g.usedAt) return false;
      if (g.expiresAt !== null && g.expiresAt !== undefined && Number(g.expiresAt) <= nowMs) {
        return false;
      }
      if (g.targetId && targetId && g.targetId !== targetId) {
        return false;
      }
      return true;
    });

    if (!matchingGrant) {
      return false;
    }

    if (options?.consumeOnce !== false && matchingGrant.duration === 'once') {
      matchingGrant.usedAt = nowMs;
      saveD1Store(store);
    }
    return true;
  };

  app.get('/api/me/role', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    const store = loadD1Store() as any;
    const roleRow = resolveD1Role(store, user);
    const canonicalRole =
      roleRow.role === 'superadmin' || roleRow.role === 'super_admin' || SUPERADMIN_UIDS.has(user.uid)
        ? 'super_admin'
        : roleRow.role;
    return res.status(200).json({
      uid: user.uid,
      email: user.email,
      username: user.username || user.name,
      displayName: user.displayName || user.username || user.name,
      accountType: user.isGuest ? 'guest' : 'registered',
      isGuest: Boolean(user.isGuest),
      plan: (roleRow as any).plan || user.plan || 'free',
      planExpiresAt: (roleRow as any).plan_expires_at || null,
      role: canonicalRole,
      customRole: roleRow.custom_role,
      isPostingBanned: Boolean(roleRow.is_posting_banned),
    });
  });

  app.get('/api/admin/roles', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    const store = loadD1Store() as any;
    if (!hasAdminPermission(store, user, 'users.view', { consumeOnce: false })) {
      return res.status(403).json({
        error: 'Permission denied: users.view is required.',
        code: 'PERMISSION_DENIED',
        permission: 'users.view',
      });
    }
    return res.status(200).json({ roles: store.userRoles || [] });
  });

  app.get('/api/admin/roles/audit', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    const store = loadD1Store() as any;
    if (!hasAdminPermission(store, user, 'audit.view', { consumeOnce: false })) {
      return res.status(403).json({
        error: 'Forbidden: audit.view permission required.',
        code: 'PERMISSION_DENIED',
        permission: 'audit.view',
      });
    }

    const byUid = new Map<string, any>();
    for (const r of store.userRoles || []) {
      const uid = String(r?.uid || '').trim();
      if (!uid) continue;
      const resolvedRole = SUPERADMIN_UIDS.has(uid) || r.role === 'superadmin' || r.role === 'super_admin'
        ? 'super_admin'
        : (r.role || 'student');
      byUid.set(uid, {
        uid,
        email: r.email || '',
        username: '',
        displayName: '',
        role: resolvedRole,
        customRole: r.custom_role || null,
        inSuperadminAllowlist: SUPERADMIN_UIDS.has(uid),
        updatedAt: r.updated_at || null,
      });
    }
    try {
      const localD1 = getSharedLocalD1Database();
      for (const u of localD1.tables.user_usernames.values()) {
        const uid = String(u?.uid || '').trim();
        if (!uid) continue;
        const existing = byUid.get(uid);
        const resolvedRole = SUPERADMIN_UIDS.has(uid)
          ? 'super_admin'
          : existing?.role && existing.role !== 'student'
            ? existing.role
            : (u.role || 'student');
        byUid.set(uid, {
          uid,
          email: u.email || existing?.email || '',
          username: u.username_display || u.username_lower || existing?.username || '',
          displayName: u.display_name || existing?.displayName || '',
          role: resolvedRole,
          customRole: u.custom_role ?? existing?.customRole ?? null,
          inSuperadminAllowlist: SUPERADMIN_UIDS.has(uid),
          updatedAt: u.updated_at || existing?.updatedAt || null,
        });
      }
    } catch {
      // Ignore if local D1 not initialized
    }

    const nonStudentUsers = Array.from(byUid.values()).filter(
      (entry) => String(entry.role || 'student').toLowerCase() !== 'student'
    );

    return res.status(200).json({
      ok: true,
      totalNonStudentCount: nonStudentUsers.length,
      nonStudentUsers,
      migrationReport: store.roleMigrationV1 || null,
    });
  });

  app.put('/api/admin/roles', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    const store = loadD1Store() as any;
    const body = req.body || {};
    const targetUid = String(body.uid || '').trim();
    const rawRole = String(body.role || 'student').trim();
    const newRole = rawRole === 'superadmin' ? 'super_admin' : rawRole;

    if (!hasAdminPermission(store, user, 'users.role', { targetId: targetUid })) {
      return res.status(403).json({
        error: 'Permission denied: users.role is required to assign roles.',
        code: 'PERMISSION_DENIED',
        permission: 'users.role',
      });
    }

    const callerRoleRow = resolveD1Role(store, user);
    const callerIsSuperAdmin =
      callerRoleRow.role === 'super_admin' ||
      callerRoleRow.role === 'superadmin' ||
      SUPERADMIN_UIDS.has(user.uid);
    if (newRole === 'super_admin' && !callerIsSuperAdmin) {
      return res.status(403).json({
        error: 'Only a Super Admin can assign the Super Admin role.',
        code: 'PERMISSION_DENIED',
        permission: 'users.role',
      });
    }

    if (!targetUid || !['student', 'crew', 'captain', 'admin', 'super_admin'].includes(newRole)) {
      return res.status(400).json({ error: 'Valid uid and role are required.', code: 'INVALID_INPUT' });
    }

    let existing = store.userRoles.find((r: any) => r.uid === targetUid);
    const wasSuperAdmin =
      existing &&
      (existing.role === 'super_admin' || existing.role === 'superadmin' || SUPERADMIN_UIDS.has(targetUid));
    if (wasSuperAdmin && newRole !== 'super_admin') {
      if (SUPERADMIN_UIDS.has(targetUid)) {
        return res.status(403).json({
          error: 'Cannot demote a protected Super Admin owner account.',
          code: 'LAST_SUPERADMIN_PROTECTED',
        });
      }
      const otherSuperAdmins = (store.userRoles || []).filter(
        (r: any) =>
          r.uid !== targetUid &&
          (r.role === 'super_admin' || r.role === 'superadmin' || SUPERADMIN_UIDS.has(r.uid))
      );
      if (otherSuperAdmins.length === 0) {
        return res.status(403).json({
          error: 'Cannot demote the last remaining Super Admin.',
          code: 'LAST_SUPERADMIN_PROTECTED',
        });
      }
    }

    if (!existing) {
      existing = {
        uid: targetUid,
        email: String(body.email || '').trim().toLowerCase(),
        role: newRole,
        custom_role: body.customRole || null,
        is_posting_banned: body.isPostingBanned ? 1 : 0,
        updated_at: Date.now(),
      };
      store.userRoles.push(existing);
    } else {
      existing.role = newRole;
      if (body.email) existing.email = String(body.email).trim().toLowerCase();
      if (body.customRole !== undefined) existing.custom_role = body.customRole;
      existing.updated_at = Date.now();
    }
    try {
      const localD1 = getSharedLocalD1Database();
      for (const u of localD1.tables.user_usernames.values()) {
        if (u.uid === targetUid) {
          u.role = newRole;
          u.updated_at = Date.now();
        }
      }
    } catch {
      // ignore
    }
    saveD1Store(store);
    return res.status(200).json({ ok: true, uid: targetUid, role: newRole });
  });

  // ── D1 Captain Tests & Grand Line Public Tests ─────────────────────────────
  const inFlightAttemptSubmissions = new Set<string>();
  const ALREADY_ATTEMPTED_MESSAGE =
    'You have already taken this drill. Only one verified attempt per student is permitted for each drill.';

  function resolveAttemptUserName(
    frontendName: unknown,
    tokenName: unknown,
    email: unknown
  ): string {
    const fromFrontend = String(frontendName ?? '').trim();
    if (fromFrontend && fromFrontend.toLowerCase() !== 'student') {
      return fromFrontend.slice(0, 120);
    }
    const fromToken = String(tokenName ?? '').trim();
    if (fromToken && fromToken.toLowerCase() !== 'student') {
      return fromToken.slice(0, 120);
    }
    const emailStr = String(email ?? '').trim();
    const emailPrefix = emailStr.includes('@') ? emailStr.split('@')[0].trim() : emailStr;
    if (emailPrefix) {
      return emailPrefix.slice(0, 120);
    }
    if (fromFrontend) return fromFrontend.slice(0, 120);
    if (fromToken) return fromToken.slice(0, 120);
    return 'Student';
  }

  function resolveLeaderboardDisplayName(
    attemptRow: any,
    store: any,
    liveAuthorsMap?: Map<string, LiveAuthorResolved>
  ): string {
    const uid = String(attemptRow?.userUid ?? attemptRow?.user_uid ?? attemptRow?.studentUid ?? '').trim();
    const live = uid && liveAuthorsMap ? liveAuthorsMap.get(uid) : undefined;
    if (live && !live.isDeleted && (live.displayName || live.username)) {
      return String(live.displayName || live.username);
    }
    const rawStored = String(attemptRow?.userName ?? attemptRow?.user_name ?? attemptRow?.studentName ?? '').trim();
    if (rawStored) return rawStored;
    if (uid && Array.isArray(store?.userRoles)) {
      const roleEntry = store.userRoles.find((r: any) => r.uid === uid);
      const email = String(roleEntry?.email || '').trim();
      if (email && email.includes('@')) {
        const prefix = email.split('@')[0].trim();
        if (prefix) return prefix;
      }
    }
    return 'Student';
  }

  function buildGradedQuestionsForAttempt(attemptRow: any, testRow: any): any[] {
    if (Array.isArray(attemptRow?.gradedQuestions) && attemptRow.gradedQuestions.length > 0) {
      return attemptRow.gradedQuestions.map((q: any, idx: number) => ({
        id: q.id || `q_${idx}`,
        position: typeof q.position === 'number' ? q.position : idx,
        question: String(q.question || q.question_text || ''),
        options: Array.isArray(q.options) ? q.options.map(String) : ['', '', '', ''],
        selectedIndex: typeof q.selectedIndex === 'number' ? q.selectedIndex : -1,
        correctIndex: Number(q.correctIndex ?? q.correct_index ?? 0),
        isCorrect: Boolean(q.isCorrect ?? (q.selectedIndex === Number(q.correctIndex ?? 0))),
        explanation: String(q.explanation || ''),
      }));
    }
    const questions = Array.isArray(testRow?.questions) ? testRow.questions : [];
    return questions.map((q: any, idx: number) => {
      const correctIndex = Number(q.correctIndex ?? q.correct_index ?? 0);
      return {
        id: q.id || `q_${idx}`,
        position: typeof q.position === 'number' ? q.position : idx,
        question: String(q.question || q.question_text || ''),
        options: Array.isArray(q.options) ? q.options.map(String) : ['', '', '', ''],
        selectedIndex: -1,
        correctIndex,
        isCorrect: false,
        explanation: String(q.explanation || ''),
      };
    });
  }

  function serializePublicScheduleFields(t: any, nowMs: number): Record<string, any> {
    const out: Record<string, any> = {
      effectiveStatus: computeGrandLineTestStatus(t, nowMs),
    };
    if (t.startAt !== undefined) out.startAt = t.startAt;
    if (t.endAt !== undefined) out.endAt = t.endAt;
    if (t.statusMode !== undefined) out.statusMode = t.statusMode;
    if (t.forceCloseAttemptsAt !== undefined) out.forceCloseAttemptsAt = t.forceCloseAttemptsAt;
    return out;
  }

  function serializeAdminScheduleFields(t: any, nowMs: number): Record<string, any> {
    const out = serializePublicScheduleFields(t, nowMs);
    if (t.reason !== undefined) out.reason = t.reason;
    return out;
  }

  function stripAdminReasonForStudent(t: any, isAdmin: boolean, nowMs: number): Record<string, any> {
    const clone: Record<string, any> = {
      ...t,
      ...(isAdmin ? serializeAdminScheduleFields(t, nowMs) : serializePublicScheduleFields(t, nowMs)),
    };
    if (!isAdmin) {
      delete clone.reason;
    }
    return clone;
  }

  app.get('/api/tests/public', (req: Request, res: Response) => {
    const store = loadD1Store() as any;
    if (!Array.isArray(store.captainTests)) store.captainTests = [];
    const nowMs = Date.now();
    const subject = String(req.query.subject || '').trim().toLowerCase();
    const list = store.captainTests
      .filter((t: any) => computeGrandLineTestStatus(t, nowMs) !== 'draft')
      .filter((t: any) => !subject || subject === 'all' || String(t.subject || '').toLowerCase() === subject)
      .sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0))
      .map((t: any) => ({
        id: t.id,
        title: t.title,
        description: t.description || '',
        subject: t.subject,
        questionCount: Number(t.questionCount ?? (t.questions?.length || 0)),
        durationMinutes: Number(t.durationMinutes || 20),
        visibility: t.visibility,
        status: t.status,
        captainUid: t.captainUid,
        captainName: t.captainName,
        crewId: t.crewId || null,
        crewName: t.crewName || 'Grand Line Crew',
        attemptsCount: Number(t.attemptsCount || 0),
        avgScore: Number(t.avgScore || 0),
        certificateThemeId: t.certificateThemeId ?? t.certificate_theme_id ?? null,
        resultsFinalised: Boolean(t.resultsFinalised ?? t.results_finalised),
        finalisedAt: t.finalisedAt ?? t.finalised_at ?? null,
        mockNumber: t.mockNumber ?? t.mock_number ?? null,
        editionLabel: t.editionLabel ?? t.edition_label ?? null,
        createdAt: t.createdAt,
        ...serializePublicScheduleFields(t, nowMs),
      }));
    return res.status(200).json({ tests: list, serverTimeMs: nowMs });
  });

  app.get('/api/tests/mine', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    const store = loadD1Store() as any;
    if (!Array.isArray(store.captainTests)) store.captainTests = [];
    const nowMs = Date.now();
    const roleRow = resolveD1Role(store, user);
    const isAdmin = ['admin', 'superadmin', 'super_admin'].includes(roleRow.role);
    const targetUid =
      isAdmin && req.query.captainUid
        ? String(req.query.captainUid)
        : user.uid;
    const list = store.captainTests
      .filter((t: any) => (isAdmin && req.query.all === '1' ? true : t.captainUid === targetUid))
      .sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0))
      .map((t: any) => stripAdminReasonForStudent(t, isAdmin, nowMs));
    return res.status(200).json({ tests: list, serverTimeMs: nowMs });
  });

  app.post('/api/tests', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    if (user.isGuest || String(user.uid || '').startsWith('guest_')) {
      return res.status(403).json({
        error: "You can't create Captain tests as a guest. Please upgrade to a full account.",
        code: 'GUEST_FORBIDDEN',
      });
    }
    const store = loadD1Store() as any;
    if (!Array.isArray(store.captainTests)) store.captainTests = [];
    if (!Array.isArray(store.crews)) store.crews = [];

    const body = req.body || {};
    const title = String(body.title || '').trim().slice(0, 200);
    if (!title) {
      return res.status(400).json({ error: 'Test title is required.', code: 'INVALID_TITLE' });
    }
    const questions = Array.isArray(body.questions) ? body.questions.slice(0, 200) : [];
    const now = Date.now();
    const crew = store.crews.find((c: any) => c.captainUid === user.uid);
    const rawThemeId =
      body.certificateThemeId !== undefined
        ? body.certificateThemeId
        : body.certificate_theme_id;
    const cleanThemeId =
      typeof rawThemeId === 'string' && rawThemeId.trim() && rawThemeId.trim() !== 'auto'
        ? rawThemeId.trim()
        : null;
    const nextMockNumber = store.captainTests.length + 1;
    const newTest = {
      id: body.id && typeof body.id === 'string' ? body.id.trim() : crypto.randomUUID(),
      title,
      description: String(body.description || '').trim(),
      subject: String(body.subject || 'Physics').trim(),
      durationMinutes: Number(body.durationMinutes || Math.max(10, questions.length * 1.5)),
      visibility: body.visibility === 'private' ? 'private' : 'public',
      status: body.status || 'published',
      captainUid: user.uid,
      captainName: String(body.captainName || user.email?.split('@')[0] || 'Captain'),
      crewId: crew?.id || null,
      crewName: String(body.crewName || crew?.name || 'Grand Line Crew'),
      questionCount: questions.length,
      certificateThemeId: cleanThemeId,
      certificate_theme_id: cleanThemeId,
      resultsFinalised: 0,
      results_finalised: 0,
      finalisedAt: null,
      finalised_at: null,
      mockNumber: Number(body.mockNumber || nextMockNumber),
      mock_number: Number(body.mockNumber || nextMockNumber),
      editionLabel: body.editionLabel ? String(body.editionLabel).trim() : null,
      questions: questions.map((q: any, idx: number) => ({
        id: crypto.randomUUID(),
        position: idx,
        question: String(q.question || q.question_text || ''),
        options: Array.isArray(q.options) ? q.options.slice(0, 4).map(String) : ['', '', '', ''],
        correctIndex: Number(q.correctIndex ?? q.correct_index ?? 0),
        explanation: String(q.explanation || ''),
        topic: String(q.topic || body.subject || 'General'),
        difficulty: q.difficulty || 'medium',
      })),
      attemptsCount: 0,
      avgScore: 0,
      createdAt: now,
      updatedAt: now,
    };
    store.captainTests.unshift(newTest);
    saveD1Store(store);
    return res.status(201).json(newTest);
  });

  app.get('/api/tests/:id/my-attempt', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    const store = loadD1Store() as any;
    if (!Array.isArray(store.captainTests)) store.captainTests = [];
    if (!Array.isArray(store.testAttempts)) store.testAttempts = [];

    const testId = decodeURIComponent(String(req.params.id || ''));
    const test = store.captainTests.find((t: any) => t.id === testId);
    const roleRow = resolveD1Role(store, user);
    const isAdmin = ['admin', 'superadmin'].includes(roleRow.role);

    const existingAttempt = store.testAttempts.find(
      (a: any) =>
        String(a.testId || a.test_id || '') === testId &&
        String(a.userUid || a.user_uid || '') === user.uid
    );

    if (!existingAttempt) {
      if (!test) {
        return res.status(404).json({ error: 'Test not found.', code: 'NOT_FOUND' });
      }

      // Admin bypass: Admins can view/download official Answer Key without taking the test
      if (isAdmin) {
        const adminName = user.name || (user.email ? user.email.split('@')[0] : 'Admin');
        const adminAnswerKeyQuestions = (test.questions || []).map((q: any, idx: number) => ({
          id: q.id || `q_${idx}`,
          position: typeof q.position === 'number' ? q.position : idx,
          question: q.question,
          options: Array.isArray(q.options) ? q.options : ['A', 'B', 'C', 'D'],
          selectedIndex: -1,
          correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
          isCorrect: true,
          explanation: q.explanation || '',
          topic: q.topic,
          difficulty: q.difficulty,
        }));

        return res.status(200).json({
          attempt: null,
          gradedQuestions: adminAnswerKeyQuestions,
          isAdminAnswerKey: true,
          isAdmin: true,
          test: {
            id: test.id,
            title: test.title,
            description: test.description || '',
            subject: test.subject,
            durationMinutes: Number(test.durationMinutes || 20),
            questionCount: Number(test.questionCount ?? (test.questions?.length || 0)),
            captainUid: test.captainUid,
            captainName: test.captainName,
            creatorShortId: test.creatorShortId || 'CAPT',
            crewId: test.crewId || null,
            crewName: test.crewName || 'Grand Line Crew',
            adminName,
          },
        });
      }

      return res.status(403).json({
        error: 'You must attempt this drill before viewing or downloading its answer key and result PDF.',
        code: 'ATTEMPT_REQUIRED',
      });
    }

    const resolvedName = resolveLeaderboardDisplayName(existingAttempt, store);
    const gradedQuestions = buildGradedQuestionsForAttempt(existingAttempt, test);

    return res.status(200).json({
      attempt: {
        ...existingAttempt,
        testId,
        testTitle: existingAttempt.testTitle || test?.title || 'Grand Line Drill',
        subject: existingAttempt.subject || test?.subject || 'General',
        captainUid: existingAttempt.captainUid || test?.captainUid || '',
        captainName: existingAttempt.captainName || test?.captainName || 'Captain',
        userUid: user.uid,
        userName: resolvedName,
        studentName: resolvedName,
        name: resolvedName,
        gradedQuestions,
      },
      gradedQuestions,
      isAdmin,
      test: test
        ? {
            id: test.id,
            title: test.title,
            description: test.description || '',
            subject: test.subject,
            durationMinutes: Number(test.durationMinutes || 20),
            questionCount: Number(test.questionCount ?? (test.questions?.length || 0)),
            captainUid: test.captainUid,
            captainName: test.captainName,
            crewId: test.crewId || null,
            crewName: test.crewName || 'Grand Line Crew',
          }
        : null,
    });
  });

  app.get('/api/tests/:id', async (req: Request, res: Response) => {
    const store = loadD1Store() as any;
    if (!Array.isArray(store.captainTests)) store.captainTests = [];
    if (!Array.isArray(store.testAttempts)) store.testAttempts = [];
    const nowMs = Date.now();
    const rawId = decodeURIComponent(String(req.params.id || ''));
    const testId = extractIdFromSlugOrId(rawId);
    const test = store.captainTests.find((t: any) => t.id === testId || t.id === rawId);
    if (!test) return res.status(404).json({ error: 'Test not found.', code: 'NOT_FOUND', serverTimeMs: nowMs });

    const isInfoOnly = req.query.view === 'info';
    const user = await verifyFirebaseJwtZeroFirestore(req);
    const roleRow = user ? resolveD1Role(store, user) : { role: 'student' };
    const isAdmin = Boolean(user && ['admin', 'superadmin'].includes(roleRow.role));
    const isOwnerOrAdmin = Boolean(user && (test.captainUid === user.uid || isAdmin));
    const effectiveStatus = computeGrandLineTestStatus(test, nowMs);

    // Draft tests are strictly hidden from students/guests
    if (effectiveStatus === 'draft' && !isOwnerOrAdmin) {
      return res.status(404).json({ error: 'Test not found.', code: 'NOT_FOUND', serverTimeMs: nowMs });
    }

    if (isInfoOnly) {
      if (test.visibility === 'private') {
        if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED', serverTimeMs: nowMs });
        if (!isOwnerOrAdmin) return res.status(403).json({ error: 'This test is private.', code: 'FORBIDDEN', serverTimeMs: nowMs });
      }
      const existingAttempt = user
        ? store.testAttempts.find(
            (a: any) =>
              String(a.testId || a.test_id || '') === test.id &&
              String(a.userUid || a.user_uid || '') === user.uid
          )
        : null;
      return res.status(200).json({
        test: {
          ...stripAdminReasonForStudent(test, isAdmin, nowMs),
          questionCount: Number(test.questionCount ?? (test.questions?.length || 0)),
          questions: [],
        },
        alreadyAttempted: Boolean(existingAttempt),
        myAttempt: existingAttempt || null,
        serverTimeMs: nowMs,
      });
    }

    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED', serverTimeMs: nowMs });

    if (test.visibility === 'private' && !isOwnerOrAdmin) {
      return res.status(403).json({ error: 'This test is private.', code: 'FORBIDDEN', serverTimeMs: nowMs });
    }

    const includeAnswers = isOwnerOrAdmin && req.query.includeAnswers === '1';

    // Enforce ONE verified attempt per drill (test_id + user_uid) when student opens/starts test
    if (!includeAnswers) {
      const existingAttempt = store.testAttempts.find(
        (a: any) =>
          String(a.testId || a.test_id || '') === test.id &&
          String(a.userUid || a.user_uid || '') === user.uid
      );
      if (existingAttempt) {
        const resolvedName = resolveLeaderboardDisplayName(existingAttempt, store);
        const gradedQuestions = buildGradedQuestionsForAttempt(existingAttempt, test);
        return res.status(409).json({
          error: ALREADY_ATTEMPTED_MESSAGE,
          message: ALREADY_ATTEMPTED_MESSAGE,
          state: 'already_attempted',
          code: 'ALREADY_ATTEMPTED',
          attemptId: existingAttempt.id,
          serverTimeMs: nowMs,
          attempt: {
            id: existingAttempt.id,
            testId: test.id,
            testTitle: existingAttempt.testTitle || test.title,
            subject: existingAttempt.subject || test.subject,
            captainUid: existingAttempt.captainUid || test.captainUid,
            captainName: existingAttempt.captainName || test.captainName,
            userUid: user.uid,
            userName: resolvedName,
            studentName: resolvedName,
            score: Number(existingAttempt.score || 0),
            totalQuestions: Number(existingAttempt.totalQuestions || (test.questions?.length || 0)),
            percentage: Number(existingAttempt.percentage || 0),
            timeTakenSeconds: Number(existingAttempt.timeTakenSeconds || 0),
            createdAt: existingAttempt.createdAt,
            gradedQuestions,
          },
        });
      }

      // Server-side schedule & status enforcement: a new attempt can ONLY be started when the test is Live
      if (effectiveStatus !== 'live') {
        const message =
          effectiveStatus === 'scheduled'
            ? 'This Grand Line test is scheduled and has not started yet.'
            : effectiveStatus === 'ended'
            ? 'This Grand Line test has ended and can no longer be started.'
            : 'This Grand Line test is not currently live.';
        return res.status(403).json({
          error: message,
          message,
          code: 'TEST_NOT_LIVE',
          effectiveStatus,
          startAt: test.startAt ?? null,
          endAt: test.endAt ?? null,
          serverTimeMs: nowMs,
        });
      }

      // Record server-side active attempt start timestamp so if the test ends while the student is taking it,
      // the server knows this student legitimately started while Live.
      inMemoryActiveAttemptStarts.set(`${test.id}:${user.uid}`, nowMs);
    }

    const sanitizedQuestions = (test.questions || []).map((q: any, idx: number) => {
      const base: any = {
        id: q.id || `q_${idx}`,
        position: idx,
        question: q.question,
        options: q.options,
        topic: q.topic,
        difficulty: q.difficulty,
      };
      if (includeAnswers) {
        base.correctIndex = q.correctIndex;
        base.explanation = q.explanation;
      }
      return base;
    });

    return res.status(200).json({
      test: {
        ...stripAdminReasonForStudent(test, isAdmin, nowMs),
        questions: sanitizedQuestions,
      },
      serverTimeMs: nowMs,
    });
  });

  function applyAdminScheduleAndStatusUpdate(
    store: any,
    existing: any,
    body: any,
    user: { uid: string; email?: string | null },
    nowMs: number
  ): { ok: true } | { ok: false; status: number; error: string; code: string } {
    const hasStartAt = body.startAt !== undefined;
    const hasEndAt = body.endAt !== undefined;
    const hasStatusMode = body.statusMode !== undefined;
    const hasReason = body.reason !== undefined;
    const hasCloseAll = body.closeAllAttemptsNow !== undefined;

    if (!hasStartAt && !hasEndAt && !hasStatusMode && !hasReason && !hasCloseAll) {
      return { ok: true };
    }

    const nextStartAt = hasStartAt
      ? normalizeOptionalTimestampMs(body.startAt)
      : normalizeOptionalTimestampMs(existing.startAt);
    const nextEndAt = hasEndAt
      ? normalizeOptionalTimestampMs(body.endAt)
      : normalizeOptionalTimestampMs(existing.endAt);

    if (nextStartAt && nextEndAt && nextEndAt <= nextStartAt) {
      return {
        ok: false,
        status: 400,
        error: 'End date and time must be after start date and time.',
        code: 'INVALID_SCHEDULE_WINDOW',
      };
    }

    const nextMode: GrandLineStatusMode = hasStatusMode
      ? normalizeStatusMode(body.statusMode) || 'auto'
      : normalizeStatusMode(existing.statusMode) || 'auto';

    const previousStatus = computeGrandLineTestStatus(existing, nowMs);
    const previousStatusMode = existing.statusMode || 'auto';
    const previousWindow = formatPktWindow(existing.startAt, existing.endAt) || 'No schedule';

    if (hasStartAt) {
      existing.startAt = nextStartAt;
    }
    if (hasEndAt) {
      existing.endAt = nextEndAt;
    }
    if (hasStatusMode) {
      existing.statusMode = nextMode;
      // Ensure legacy status/visibility does not block an admin-scheduled or force-live test
      if (nextMode === 'forceLive') {
        existing.status = 'published';
        existing.visibility = 'public';
        existing.resultsFinalised = 0;
        existing.results_finalised = 0;
      } else if (nextMode === 'forceEnded') {
        existing.status = 'published';
        existing.visibility = 'public';
        existing.resultsFinalised = 1;
        existing.results_finalised = 1;
        existing.finalisedAt = existing.finalisedAt || nowMs;
        existing.finalised_at = existing.finalised_at || nowMs;
      } else if (nextMode === 'auto' && (nextStartAt || nextEndAt)) {
        existing.status = 'published';
        existing.visibility = 'public';
      }
    }
    if (hasReason) {
      const cleanReason =
        typeof body.reason === 'string' && body.reason.trim()
          ? body.reason.trim().slice(0, 500)
          : null;
      existing.reason = cleanReason;
    }

    if (nextMode === 'forceEnded' && body.closeAllAttemptsNow === true) {
      existing.forceCloseAttemptsAt = nowMs;
    } else if (nextMode !== 'forceEnded' || body.closeAllAttemptsNow === false) {
      if (existing.forceCloseAttemptsAt !== undefined) {
        existing.forceCloseAttemptsAt = null;
      }
    }

    const newStatus = computeGrandLineTestStatus(existing, nowMs);
    const newStatusMode = existing.statusMode || 'auto';
    const newWindow = formatPktWindow(existing.startAt, existing.endAt) || 'No schedule';

    if (!Array.isArray(store.grandLineAuditLogs)) {
      store.grandLineAuditLogs = [];
    }
    store.grandLineAuditLogs.unshift({
      id: `gl_sched_${nowMs}_${crypto.randomUUID().slice(0, 8)}`,
      adminEmail: String(user.email || 'admin').toLowerCase(),
      adminUid: user.uid,
      action: 'grand_line_schedule_status_updated',
      targetUid: existing.id,
      targetEmail: existing.title,
      details: {
        testId: existing.id,
        testTitle: existing.title,
        previousStatus,
        newStatus,
        previousStatusMode,
        newStatusMode,
        previousWindow,
        newWindow,
        startAt: existing.startAt ?? null,
        endAt: existing.endAt ?? null,
        closeAllAttemptsNow: Boolean(body.closeAllAttemptsNow),
        reason: existing.reason ?? null,
      },
      timestampMs: nowMs,
    });
    if (store.grandLineAuditLogs.length > 500) {
      store.grandLineAuditLogs = store.grandLineAuditLogs.slice(0, 500);
    }

    return { ok: true };
  }

  app.post('/api/tests/:id/schedule', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    const store = loadD1Store() as any;
    if (!Array.isArray(store.captainTests)) store.captainTests = [];
    const rawId = decodeURIComponent(String(req.params.id || '')).trim();
    const altId = rawId.replace(/-/g, '_');
    const existing = store.captainTests.find((t: any) => t.id === rawId || t.id === altId);
    const resolvedTargetId = existing ? existing.id : rawId;

    const requiredPerm = req.body?.statusMode === 'forceEnded' ? 'tests.end' : 'tests.manage';
    if (!hasAdminPermission(store, user, requiredPerm, { targetId: resolvedTargetId })) {
      return res.status(403).json({
        error: `Permission denied: ${requiredPerm} is required to change a Grand Line test schedule or status.`,
        code: 'PERMISSION_DENIED',
        permission: requiredPerm,
      });
    }

    if (!existing) return res.status(404).json({ error: 'Test not found.', code: 'NOT_FOUND' });

    const nowMs = Date.now();
    const result = applyAdminScheduleAndStatusUpdate(store, existing, req.body || {}, user, nowMs);
    if (!result.ok) {
      return res.status(result.status).json({ error: result.error, code: result.code });
    }

    existing.updatedAt = nowMs;
    saveD1Store(store);

    return res.status(200).json({
      ok: true,
      test: stripAdminReasonForStudent(existing, true, nowMs),
      serverTimeMs: nowMs,
    });
  });

  app.get('/api/admin/grand-line-audit-logs', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    const store = loadD1Store() as any;
    if (!hasAdminPermission(store, user, 'audit.view', { consumeOnce: false })) {
      return res.status(403).json({
        error: 'Permission denied: audit.view is required.',
        code: 'PERMISSION_DENIED',
        permission: 'audit.view',
      });
    }
    const logs = Array.isArray(store.grandLineAuditLogs) ? store.grandLineAuditLogs : [];
    return res.status(200).json({ ok: true, logs });
  });

  app.put('/api/tests/:id', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    const store = loadD1Store() as any;
    if (!Array.isArray(store.captainTests)) store.captainTests = [];
    const testId = decodeURIComponent(String(req.params.id || ''));
    const idx = store.captainTests.findIndex((t: any) => t.id === testId);
    if (idx === -1) return res.status(404).json({ error: 'Test not found.', code: 'NOT_FOUND' });

    const existing = store.captainTests[idx];
    const body = req.body || {};
    const touchesScheduleOrStatusMode =
      body.startAt !== undefined ||
      body.endAt !== undefined ||
      body.statusMode !== undefined ||
      body.reason !== undefined ||
      body.closeAllAttemptsNow !== undefined;

    const requiredPerm = body.statusMode === 'forceEnded' ? 'tests.end' : 'tests.manage';
    const hasPerm = hasAdminPermission(store, user, requiredPerm, { targetId: testId });
    if (existing.captainUid !== user.uid && !hasPerm) {
      return res.status(403).json({
        error: `Permission denied: ${requiredPerm} is required.`,
        code: 'PERMISSION_DENIED',
        permission: requiredPerm,
      });
    }

    if (touchesScheduleOrStatusMode && !hasPerm) {
      return res.status(403).json({
        error: `Permission denied: ${requiredPerm} is required to change a Grand Line test schedule or status.`,
        code: 'PERMISSION_DENIED',
        permission: requiredPerm,
      });
    }

    const nowMs = Date.now();
    if (touchesScheduleOrStatusMode && hasPerm) {
      const schedResult = applyAdminScheduleAndStatusUpdate(store, existing, body, user, nowMs);
      if (!schedResult.ok) {
        return res.status(schedResult.status).json({ error: schedResult.error, code: schedResult.code });
      }
    }

    if (body.title !== undefined) existing.title = String(body.title).trim();
    if (body.description !== undefined) existing.description = String(body.description).trim();
    if (body.subject !== undefined) existing.subject = String(body.subject).trim();
    if (body.visibility !== undefined) existing.visibility = body.visibility === 'private' ? 'private' : 'public';
    if (body.status !== undefined) existing.status = body.status;
    if (body.editionLabel !== undefined) existing.editionLabel = body.editionLabel ? String(body.editionLabel).trim() : null;
    if (body.certificateThemeId !== undefined || body.certificate_theme_id !== undefined) {
      const rawTheme = body.certificateThemeId !== undefined ? body.certificateThemeId : body.certificate_theme_id;
      const cleanTheme =
        typeof rawTheme === 'string' && rawTheme.trim() && rawTheme.trim() !== 'auto'
          ? rawTheme.trim()
          : null;
      existing.certificateThemeId = cleanTheme;
      existing.certificate_theme_id = cleanTheme;
    }
    if (Array.isArray(body.questions)) {
      existing.questions = body.questions.slice(0, 200).map((q: any, i: number) => ({
        id: q.id || crypto.randomUUID(),
        position: i,
        question: String(q.question || ''),
        options: Array.isArray(q.options) ? q.options.slice(0, 4).map(String) : ['', '', '', ''],
        correctIndex: Number(q.correctIndex ?? 0),
        explanation: String(q.explanation || ''),
        topic: String(q.topic || existing.subject),
        difficulty: q.difficulty || 'medium',
      }));
      existing.questionCount = existing.questions.length;
    }
    existing.updatedAt = nowMs;
    saveD1Store(store);
    return res.status(200).json({
      ok: true,
      id: testId,
      certificateThemeId: existing.certificateThemeId ?? null,
      serverTimeMs: nowMs,
    });
  });

  app.delete('/api/tests/:id', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    const store = loadD1Store() as any;
    if (!Array.isArray(store.captainTests)) store.captainTests = [];
    const testId = decodeURIComponent(String(req.params.id || ''));
    const existing = store.captainTests.find((t: any) => t.id === testId);
    if (!existing) return res.status(404).json({ error: 'Test not found.', code: 'NOT_FOUND' });

    if (existing.captainUid !== user.uid && !hasAdminPermission(store, user, 'tests.manage', { targetId: testId })) {
      return res.status(403).json({
        error: 'Permission denied: tests.manage is required.',
        code: 'PERMISSION_DENIED',
        permission: 'tests.manage',
      });
    }
    store.captainTests = store.captainTests.filter((t: any) => t.id !== testId);
    if (Array.isArray(store.testAttempts)) {
      store.testAttempts = store.testAttempts.filter((a: any) => a.testId !== testId);
    }
    saveD1Store(store);
    return res.status(200).json({ ok: true, id: testId });
  });

  app.post('/api/tests/:id/publish', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    const store = loadD1Store() as any;
    if (!Array.isArray(store.captainTests)) store.captainTests = [];
    const testId = decodeURIComponent(String(req.params.id || ''));
    const existing = store.captainTests.find((t: any) => t.id === testId);
    if (!existing) return res.status(404).json({ error: 'Test not found.', code: 'NOT_FOUND' });

    if (existing.captainUid !== user.uid && !hasAdminPermission(store, user, 'tests.manage', { targetId: testId })) {
      return res.status(403).json({
        error: 'Permission denied: tests.manage is required.',
        code: 'PERMISSION_DENIED',
        permission: 'tests.manage',
      });
    }
    const body = req.body || {};
    existing.status =
      body.status || (existing.status === 'published' ? 'unpublished' : 'published');
    if (body.visibility) existing.visibility = body.visibility;
    existing.updatedAt = Date.now();
    saveD1Store(store);
    return res.status(200).json({
      ok: true,
      id: testId,
      status: existing.status,
      visibility: existing.visibility,
    });
  });

  app.post('/api/tests/:id/questions', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    const store = loadD1Store() as any;
    if (!Array.isArray(store.captainTests)) store.captainTests = [];
    const testId = decodeURIComponent(String(req.params.id || ''));
    const existing = store.captainTests.find((t: any) => t.id === testId);
    if (!existing) return res.status(404).json({ error: 'Test not found.', code: 'NOT_FOUND' });

    const roleRow = resolveD1Role(store, user);
    if (existing.captainUid !== user.uid && !['admin', 'superadmin'].includes(roleRow.role)) {
      return res.status(403).json({ error: 'Forbidden', code: 'FORBIDDEN' });
    }

    const body = req.body || {};
    if (!Array.isArray(body.questions) || body.questions.length === 0) {
      return res.status(400).json({ error: 'At least 1 question is required.', code: 'EMPTY_QUESTIONS' });
    }
    if (body.questions.length > 200) {
      return res.status(400).json({ error: 'Maximum 200 questions allowed per test.', code: 'MAX_QUESTIONS_EXCEEDED' });
    }

    const mapped = body.questions.map((q: any, i: number) => ({
      id: q.id || crypto.randomUUID(),
      position: i,
      question: String(q.question || q.question_text || ''),
      options: Array.isArray(q.options) ? q.options.slice(0, 4).map(String) : ['', '', '', ''],
      correctIndex: Number(q.correctIndex ?? q.correct_index ?? 0),
      explanation: String(q.explanation || ''),
      topic: String(q.topic || existing.subject || 'General'),
      difficulty: q.difficulty || 'medium',
    }));

    existing.questions = body.replace === false ? [...(existing.questions || []), ...mapped].slice(0, 200) : mapped;
    existing.questionCount = existing.questions.length;
    existing.updatedAt = Date.now();
    saveD1Store(store);

    return res.status(200).json({
      ok: true,
      testId,
      questionCount: existing.questionCount,
    });
  });

  app.post('/api/tests/:id/attempts', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });

    const testId = decodeURIComponent(String(req.params.id || ''));
    const lockKey = `${testId}:${user.uid}`;

    if (inFlightAttemptSubmissions.has(lockKey)) {
      const storeSnap = loadD1Store() as any;
      const existingInStore = (storeSnap.testAttempts || []).find(
        (a: any) =>
          String(a.testId || a.test_id || '') === testId &&
          String(a.userUid || a.user_uid || '') === user.uid
      );
      return res.status(409).json({
        error: ALREADY_ATTEMPTED_MESSAGE,
        message: ALREADY_ATTEMPTED_MESSAGE,
        code: 'ALREADY_ATTEMPTED',
        attemptId: existingInStore?.id || null,
        attempt: existingInStore || null,
      });
    }

    inFlightAttemptSubmissions.add(lockKey);
    try {
      const store = loadD1Store() as any;
      if (!Array.isArray(store.captainTests)) store.captainTests = [];
      if (!Array.isArray(store.testAttempts)) store.testAttempts = [];

      const test = store.captainTests.find((t: any) => t.id === testId);
      if (!test) return res.status(404).json({ error: 'Test not found.', code: 'NOT_FOUND' });

      const existingAttempt = store.testAttempts.find(
        (a: any) =>
          String(a.testId || a.test_id || '') === testId &&
          String(a.userUid || a.user_uid || '') === user.uid
      );
      if (existingAttempt) {
        const resolvedName = resolveLeaderboardDisplayName(existingAttempt, store);
        const gradedQuestions = buildGradedQuestionsForAttempt(existingAttempt, test);
        return res.status(409).json({
          error: ALREADY_ATTEMPTED_MESSAGE,
          message: ALREADY_ATTEMPTED_MESSAGE,
          state: 'already_attempted',
          code: 'ALREADY_ATTEMPTED',
          attemptId: existingAttempt.id,
          attempt: {
            ...existingAttempt,
            userName: resolvedName,
            studentName: resolvedName,
            name: resolvedName,
            gradedQuestions,
          },
        });
      }

      const nowMs = Date.now();
      const effectiveStatus = computeGrandLineTestStatus(test, nowMs);

      if (effectiveStatus !== 'live') {
        if (effectiveStatus === 'draft' || effectiveStatus === 'scheduled') {
          return res.status(403).json({
            error: 'This Grand Line test is not currently live and cannot accept submissions.',
            code: 'TEST_NOT_LIVE',
            effectiveStatus,
            serverTimeMs: nowMs,
          });
        }

        // Test is 'ended': check if admin force-closed all attempts or if student started while Live
        const forceCloseAt = normalizeOptionalTimestampMs(test.forceCloseAttemptsAt);
        if (forceCloseAt && nowMs > forceCloseAt + 60_000) {
          return res.status(403).json({
            error: 'This Grand Line test was closed by an administrator and is no longer accepting submissions.',
            code: 'TEST_FORCE_CLOSED',
            effectiveStatus: 'ended',
            serverTimeMs: nowMs,
          });
        }

        const startedAtMs = inMemoryActiveAttemptStarts.get(lockKey);
        const maxAllowedDurationMs = (Math.max(5, Number(test.durationMinutes || 20)) + 5) * 60 * 1000;
        const endRefMs =
          normalizeOptionalTimestampMs(test.endAt) ||
          normalizeOptionalTimestampMs(test.updatedAt) ||
          nowMs;

        const startedBeforeEndAndWithinDuration =
          startedAtMs !== undefined &&
          startedAtMs <= endRefMs + 60_000 &&
          nowMs - startedAtMs <= maxAllowedDurationMs;

        const withinDurationAfterScheduledEnd =
          startedAtMs === undefined &&
          nowMs - endRefMs <= maxAllowedDurationMs &&
          Number(req.body?.timeTakenSeconds || 0) > 0;

        if (!startedBeforeEndAndWithinDuration && !withinDurationAfterScheduledEnd) {
          return res.status(403).json({
            error: 'This Grand Line test has ended and the submission window has closed.',
            code: 'TEST_ENDED',
            effectiveStatus: 'ended',
            serverTimeMs: nowMs,
          });
        }
      }

      const questions = test.questions || [];
      const body = req.body || {};
      const rawAnswers = body.answers || {};
      let score = 0;

      const gradedQuestions = questions.map((q: any, idx: number) => {
        let selectedIndex = -1;
        if (Array.isArray(rawAnswers)) {
          selectedIndex = Number(rawAnswers[idx] ?? -1);
        } else if (rawAnswers && typeof rawAnswers === 'object') {
          selectedIndex = Number(rawAnswers[q.id] ?? rawAnswers[idx] ?? -1);
        }
        if (Number.isNaN(selectedIndex)) selectedIndex = -1;
        const correctIndex = Number(q.correctIndex ?? 0);
        const isCorrect = selectedIndex === correctIndex;
        if (isCorrect) score++;
        return {
          id: q.id || `q_${idx}`,
          position: idx,
          question: q.question,
          options: q.options,
          selectedIndex,
          correctIndex,
          isCorrect,
          explanation: q.explanation || '',
        };
      });

      const totalQuestions = questions.length;
      const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
      const resolvedUserName = resolveAttemptUserName(
        body.userName ?? body.studentName,
        user.tokenName,
        user.email
      );
      const resolvedAvatar = sanitizeStoreAvatarId(body.userAvatar);

      const attempt = {
        id: crypto.randomUUID(),
        testId: test.id,
        testTitle: test.title,
        subject: test.subject,
        captainUid: test.captainUid,
        captainName: test.captainName,
        userUid: user.uid,
        userName: resolvedUserName,
        studentName: resolvedUserName,
        name: resolvedUserName,
        userAvatar: resolvedAvatar,
        score,
        totalQuestions,
        percentage,
        timeTakenSeconds: Math.max(0, Number(body.timeTakenSeconds || 0)),
        createdAt: Date.now(),
        gradedQuestions,
      };

      store.testAttempts.unshift(attempt);
      const prevAttempts = Number(test.attemptsCount || 0);
      const prevAvg = Number(test.avgScore || 0);
      test.attemptsCount = prevAttempts + 1;
      test.avgScore = Math.round(((prevAvg * prevAttempts + percentage) / test.attemptsCount) * 10) / 10;
      saveD1Store(store);

      // If caller is a guest, also persist this attempt and updated stats into D1 `guest_accounts`
      if (user.isGuest || String(user.uid || '').startsWith('guest_')) {
        try {
          const { getSharedLocalD1Database } = await import('../../functions/_utils/firestoreRestAdmin');
          const d1 = getSharedLocalD1Database();
          const gRow = await d1
            .prepare('SELECT * FROM guest_accounts WHERE uid = ?1 LIMIT 1')
            .bind(user.uid)
            .first<Record<string, any>>();
          if (gRow) {
            let gAttempts: any[] = [];
            let gStats: Record<string, any> = {};
            try {
              gAttempts = JSON.parse(String(gRow.attempts_json || '[]'));
              if (!Array.isArray(gAttempts)) gAttempts = [];
            } catch {
              gAttempts = [];
            }
            try {
              gStats = JSON.parse(String(gRow.stats_json || '{}'));
            } catch {
              gStats = {};
            }
            gAttempts = [
              attempt,
              ...gAttempts.filter((a: any) => String(a?.id || '') !== attempt.id),
            ].slice(0, 100);
            const nextTests = Number(gRow.tests_completed || 0) + 1;
            const nextSolved = Number(gRow.total_questions_solved || 0) + totalQuestions;
            const nextStreak = Math.max(1, Number(gRow.streak || 0));
            gStats.testsCompleted = nextTests;
            gStats.totalQuestionsSolved = nextSolved;
            gStats.correctAnswers = Number(gStats.correctAnswers || 0) + score;
            await d1
              .prepare(
                `UPDATE guest_accounts
                 SET tests_completed = ?1, total_questions_solved = ?2, streak = ?3,
                     target_university = ?4, stats_json = ?5, attempts_json = ?6, last_active_at = ?7
                 WHERE uid = ?8`
              )
              .bind(
                nextTests,
                nextSolved,
                nextStreak,
                String(gRow.target_university || 'General Prep'),
                JSON.stringify(gStats),
                JSON.stringify(gAttempts),
                Date.now(),
                user.uid
              )
              .run();
          }
        } catch {
          // Non-fatal
        }
      }

      inMemoryActiveAttemptStarts.delete(lockKey);
      return res.status(201).json({ attempt, serverTimeMs: Date.now() });
    } finally {
      inFlightAttemptSubmissions.delete(lockKey);
    }
  });

  app.get('/api/attempts/mine', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    const store = loadD1Store() as any;
    const storeAttempts = (store.testAttempts || [])
      .filter((a: any) => String(a.userUid || a.user_uid || '') === user.uid)
      .sort((a: any, b: any) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
      .map((a: any) => {
        const resolvedName = resolveLeaderboardDisplayName(a, store);
        return {
          ...a,
          testId: a.testId || a.test_id,
          userUid: a.userUid || a.user_uid,
          userName: resolvedName,
          studentName: resolvedName,
          name: resolvedName,
        };
      });

    if (user.isGuest || String(user.uid || '').startsWith('guest_')) {
      try {
        const { getSharedLocalD1Database } = await import('../../functions/_utils/firestoreRestAdmin');
        const d1 = getSharedLocalD1Database();
        const gRow = await d1
          .prepare('SELECT attempts_json, username, display_name FROM guest_accounts WHERE uid = ?1 LIMIT 1')
          .bind(user.uid)
          .first<{ attempts_json: string; username: string; display_name: string }>();
        if (gRow?.attempts_json) {
          const parsed = JSON.parse(String(gRow.attempts_json || '[]'));
          if (Array.isArray(parsed)) {
            const seenIds = new Set(storeAttempts.map((a: any) => String(a.id)));
            for (const ga of parsed) {
              if (ga && ga.id && !seenIds.has(String(ga.id))) {
                seenIds.add(String(ga.id));
                storeAttempts.push({
                  ...ga,
                  userUid: user.uid,
                  userName: gRow.username || user.name,
                  studentName: gRow.display_name || gRow.username || user.name,
                  name: gRow.display_name || gRow.username || user.name,
                });
              }
            }
          }
        }
      } catch {
        // Non-fatal
      }
    }

    return res.status(200).json({ attempts: storeAttempts });
  });

  const handleTestResultsOrLeaderboard = async (req: Request, res: Response) => {
    const store = loadD1Store() as any;
    const testId = decodeURIComponent(String(req.params.id || ''));
    const filtered = (store.testAttempts || [])
      .filter((a: any) => String(a.testId || a.test_id || '') === testId)
      .sort(
        (a: any, b: any) =>
          Number(b.percentage || 0) - Number(a.percentage || 0) ||
          Number(b.score || 0) - Number(a.score || 0) ||
          Number(a.timeTakenSeconds || 0) - Number(b.timeTakenSeconds || 0)
      );
    const liveAuthorsMap = resolveLiveAuthorsBatchSync(
      filtered.map((a: any) => a.userUid || a.user_uid),
      store
    );
    const list = filtered.map((a: any, idx: number) => {
      const uid = String(a.userUid || a.user_uid || '');
      const live = uid ? liveAuthorsMap.get(uid) : undefined;
      const resolvedName = resolveLeaderboardDisplayName(a, store, liveAuthorsMap);
      const { gradedQuestions: _omitGraded, ...publicFields } = a;
      return {
        ...publicFields,
        testId: a.testId || a.test_id,
        userUid: uid,
        username: (live && !live.isDeleted && live.username) || undefined,
        userName: resolvedName,
        studentName: resolvedName,
        name: resolvedName,
        userAvatar:
          (live && !live.isDeleted && live.avatar) ||
          sanitizeStoreAvatarId(a.userAvatar, a.user_avatar),
        proBadge: (live && !live.isDeleted && live.proBadge) || null,
        rank: idx + 1,
      };
    });
    return res.status(200).json({ results: list });
  };

  app.get('/api/tests/:id/results', handleTestResultsOrLeaderboard);
  app.get('/api/tests/:id/leaderboard', handleTestResultsOrLeaderboard);

  app.get('/api/leaderboard/grand-line', (_req: Request, res: Response) => {
    const store = loadD1Store() as any;
    const attempts = store.testAttempts || [];
    const liveAuthorsMap = resolveLiveAuthorsBatchSync(
      attempts.map((a: any) => a.userUid || a.user_uid),
      store
    );
    const byUser = new Map<string, any>();
    for (const a of attempts) {
      const uid = String(a.userUid || a.user_uid || '');
      if (!uid) continue;
      const live = liveAuthorsMap.get(uid);
      const resolvedName = resolveLeaderboardDisplayName(a, store, liveAuthorsMap);
      const avatar =
        (live && !live.isDeleted && live.avatar) ||
        sanitizeStoreAvatarId(a.userAvatar, a.user_avatar);
      const timeSec = Number(a.timeTakenSeconds ?? a.time_taken_seconds ?? 0);
      const existing = byUser.get(uid);
      if (!existing) {
        byUser.set(uid, {
          uid,
          userUid: uid,
          username: (live && !live.isDeleted && live.username) || undefined,
          displayName: resolvedName,
          userName: resolvedName,
          studentName: resolvedName,
          name: resolvedName,
          userAvatar: avatar,
          proBadge: (live && !live.isDeleted && live.proBadge) || null,
          testsCompleted: 1,
          totalScore: Number(a.score || 0),
          totalQuestions: Number(a.totalQuestions || 0),
          bestPercentage: Number(a.percentage || 0),
          timeTakenSeconds: timeSec,
          lastTestTitle: a.testTitle || 'Grand Line Drill',
          updatedAt: a.createdAt,
        });
      } else {
        existing.testsCompleted += 1;
        existing.totalScore += Number(a.score || 0);
        existing.totalQuestions += Number(a.totalQuestions || 0);
        if (Number(a.percentage || 0) > existing.bestPercentage) {
          existing.bestPercentage = Number(a.percentage || 0);
          existing.timeTakenSeconds = timeSec;
        }
        if (existing.displayName === 'Student' && resolvedName !== 'Student') {
          existing.displayName = resolvedName;
          existing.userName = resolvedName;
          existing.studentName = resolvedName;
          existing.name = resolvedName;
        }
        if (!existing.userAvatar && avatar) {
          existing.userAvatar = avatar;
        }
      }
    }
    const leaderboard = Array.from(byUser.values())
      .sort(
        (a, b) =>
          b.bestPercentage - a.bestPercentage ||
          b.totalScore - a.totalScore ||
          a.timeTakenSeconds - b.timeTakenSeconds
      )
      .map((entry, idx) => ({
        ...entry,
        rank: idx + 1,
      }));
    return res.status(200).json({ leaderboard });
  });

  // ── D1 Crews & Crew Members ────────────────────────────────────────────────
  app.get('/api/crews', (_req: Request, res: Response) => {
    const store = loadD1Store() as any;
    if (!Array.isArray(store.crews)) store.crews = [];
    const liveMap = resolveLiveAuthorsBatchSync(
      store.crews.map((c: any) => c.captainUid),
      store
    );
    const crews = store.crews.map((c: any) => {
      const live = c.captainUid ? liveMap.get(c.captainUid) : undefined;
      const useLive = Boolean(live && !live.isDeleted);
      return {
        ...c,
        captainName:
          (useLive && (live?.displayName || live?.username)) ||
          c.captainName ||
          'Captain',
        captainUsername: (useLive && live?.username) || c.captainUsername || undefined,
        captainAvatar: (useLive && live?.avatar) || c.captainAvatar || null,
        proBadge: (useLive && live?.proBadge) || null,
      };
    });
    return res.status(200).json({ crews });
  });

  app.get('/api/crews/mine', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    const store = loadD1Store() as any;
    if (!Array.isArray(store.crews)) store.crews = [];
    if (!Array.isArray(store.crewMembers)) store.crewMembers = [];

    let crew = store.crews.find((c: any) => c.captainUid === user.uid);
    if (!crew) {
      const m = store.crewMembers.find((cm: any) => cm.userUid === user.uid && cm.status === 'active');
      if (m) crew = store.crews.find((c: any) => c.id === m.crewId);
    }
    if (!crew) return res.status(200).json({ crew: null, members: [] });
    const rawMembers = store.crewMembers.filter((cm: any) => cm.crewId === crew.id);
    const liveMap = resolveLiveAuthorsBatchSync(
      [crew.captainUid, ...rawMembers.map((m: any) => m.userUid)],
      store
    );
    const capLive = crew.captainUid ? liveMap.get(crew.captainUid) : undefined;
    const hydratedCrew = {
      ...crew,
      captainName:
        (capLive && !capLive.isDeleted && (capLive.displayName || capLive.username)) ||
        crew.captainName ||
        'Captain',
      captainUsername: (capLive && !capLive.isDeleted && capLive.username) || undefined,
      captainAvatar: (capLive && !capLive.isDeleted && capLive.avatar) || crew.captainAvatar || null,
      proBadge: (capLive && !capLive.isDeleted && capLive.proBadge) || null,
    };
    const members = rawMembers.map((m: any) => {
      const live = m.userUid ? liveMap.get(m.userUid) : undefined;
      const useLive = Boolean(live && !live.isDeleted);
      return {
        ...m,
        userName:
          (useLive && (live?.displayName || live?.username)) ||
          m.userName ||
          'Student',
        username: (useLive && live?.username) || m.username || undefined,
        userAvatar: (useLive && live?.avatar) || m.userAvatar || null,
        proBadge: (useLive && live?.proBadge) || null,
      };
    });
    return res.status(200).json({ crew: hydratedCrew, members });
  });

  app.post('/api/crews', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    const store = loadD1Store() as any;
    if (!Array.isArray(store.crews)) store.crews = [];
    if (!Array.isArray(store.crewMembers)) store.crewMembers = [];

    const body = req.body || {};
    const name = String(body.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Crew name is required.' });
    const now = Date.now();
    const crewId = crypto.randomUUID();
    const code =
      String(body.code || '').trim().toUpperCase() ||
      `NK-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const captainName = String(body.captainName || user.email?.split('@')[0] || 'Captain');

    const newCrew = {
      id: crewId,
      code,
      name,
      description: String(body.description || ''),
      university: String(body.university || ''),
      captainUid: user.uid,
      captainName,
      captainEmail: user.email || '',
      status: 'active',
      memberCount: 1,
      createdAt: now,
      updatedAt: now,
    };
    store.crews.unshift(newCrew);
    store.crewMembers.push({
      id: crypto.randomUUID(),
      crewId,
      userUid: user.uid,
      userName: captainName,
      userEmail: user.email || '',
      role: 'captain',
      status: 'active',
      joinedAt: now,
    });
    saveD1Store(store);
    return res.status(201).json({ crew: newCrew });
  });

  app.post('/api/crews/join', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    const store = loadD1Store() as any;
    if (!Array.isArray(store.crews)) store.crews = [];
    if (!Array.isArray(store.crewMembers)) store.crewMembers = [];

    const codeOrId = String(req.body?.code || req.body?.crewId || '').trim().toUpperCase();
    const crew = store.crews.find(
      (c: any) => c.id === codeOrId || String(c.code || '').toUpperCase() === codeOrId
    );
    if (!crew) return res.status(404).json({ error: 'Crew not found.' });

    const existing = store.crewMembers.find(
      (m: any) => m.crewId === crew.id && m.userUid === user.uid
    );
    if (!existing) {
      store.crewMembers.push({
        id: crypto.randomUUID(),
        crewId: crew.id,
        userUid: user.uid,
        userName: user.email?.split('@')[0] || 'Student',
        userEmail: user.email || '',
        role: 'member',
        status: 'active',
        joinedAt: Date.now(),
      });
      crew.memberCount = store.crewMembers.filter(
        (m: any) => m.crewId === crew.id && m.status === 'active'
      ).length;
      saveD1Store(store);
    }
    return res.status(200).json({ ok: true, crewId: crew.id, crewName: crew.name });
  });

  app.get('/api/crews/:id/members', async (req: Request, res: Response) => {
    const store = loadD1Store() as any;
    const crewId = decodeURIComponent(String(req.params.id || ''));
    const rawMembers = (store.crewMembers || []).filter((m: any) => m.crewId === crewId);
    const liveMap = resolveLiveAuthorsBatchSync(
      rawMembers.map((m: any) => m.userUid),
      store
    );
    const members = rawMembers.map((m: any) => {
      const live = m.userUid ? liveMap.get(m.userUid) : undefined;
      const useLive = Boolean(live && !live.isDeleted);
      return {
        ...m,
        userName:
          (useLive && (live?.displayName || live?.username)) ||
          m.userName ||
          'Student',
        username: (useLive && live?.username) || m.username || undefined,
        userAvatar: (useLive && live?.avatar) || m.userAvatar || null,
        proBadge: (useLive && live?.proBadge) || null,
      };
    });
    return res.status(200).json({ members });
  });

  app.post('/api/crews/:id/suspend', async (req: Request, res: Response) => {
    const store = loadD1Store() as any;
    const crewId = decodeURIComponent(String(req.params.id || ''));
    const crew = (store.crews || []).find((c: any) => c.id === crewId);
    if (!crew) return res.status(404).json({ error: 'Crew not found.' });
    crew.status = crew.status === 'active' ? 'suspended' : 'active';
    saveD1Store(store);
    return res.status(200).json({ ok: true, id: crewId, status: crew.status });
  });

  app.delete('/api/crews/:id', async (req: Request, res: Response) => {
    const store = loadD1Store() as any;
    const crewId = decodeURIComponent(String(req.params.id || ''));
    store.crews = (store.crews || []).filter((c: any) => c.id !== crewId);
    store.crewMembers = (store.crewMembers || []).filter((m: any) => m.crewId !== crewId);
    saveD1Store(store);
    return res.status(200).json({ ok: true, id: crewId });
  });

  app.post('/api/crews/:id/members/:uid/suspend', async (req: Request, res: Response) => {
    const store = loadD1Store() as any;
    const crewId = decodeURIComponent(String(req.params.id || ''));
    const memberUid = decodeURIComponent(String(req.params.uid || ''));
    const member = (store.crewMembers || []).find(
      (m: any) => m.crewId === crewId && m.userUid === memberUid
    );
    if (!member) return res.status(404).json({ error: 'Member not found.' });
    member.status = member.status === 'active' ? 'suspended' : 'active';
    saveD1Store(store);
    return res.status(200).json({ ok: true, userUid: memberUid, status: member.status });
  });

  app.delete('/api/crews/:id/members/:uid', async (req: Request, res: Response) => {
    const store = loadD1Store() as any;
    const crewId = decodeURIComponent(String(req.params.id || ''));
    const memberUid = decodeURIComponent(String(req.params.uid || ''));
    store.crewMembers = (store.crewMembers || []).filter(
      (m: any) => !(m.crewId === crewId && m.userUid === memberUid && m.role !== 'captain')
    );
    saveD1Store(store);
    return res.status(200).json({ ok: true, userUid: memberUid });
  });

  // ===========================================================================
  // GRAND LINE CERTIFICATES & PRIVATE ADMIN SIGNATURES (D1 + PRIVATE R2)
  // ===========================================================================

  function ensureCertificateStoreArrays(store: any): void {
    if (!Array.isArray(store.certificateSignatures)) {
      store.certificateSignatures = [];
    }
    if (!Array.isArray(store.certificates)) {
      store.certificates = [];
    }
    if (!Array.isArray(store.captainTests)) {
      store.captainTests = [];
    }
    if (!Array.isArray(store.testAttempts)) {
      store.testAttempts = [];
    }
  }

  function writePrivateR2File(r2Key: string, data: Buffer): void {
    const cleanKey = String(r2Key || '').replace(/\.\./g, '').replace(/^\/+/, '');
    const fullPath = path.join(R2_LOCAL_DIR, cleanKey);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, data);
  }

  function readPrivateR2File(r2Key: string): Buffer | null {
    const cleanKey = String(r2Key || '').replace(/\.\./g, '').replace(/^\/+/, '');
    if (!cleanKey) return null;
    const fullPath = path.join(R2_LOCAL_DIR, cleanKey);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      return fs.readFileSync(fullPath);
    }
    return null;
  }

  function getSignatureDataUrlForVersion(store: any, version: number): {
    signatureRow: any | null;
    dataUrl: string | null;
  } {
    ensureCertificateStoreArrays(store);
    if (!version || version <= 0) {
      return { signatureRow: null, dataUrl: null };
    }
    const sigRow = store.certificateSignatures.find(
      (s: any) => Number(s.version) === Number(version)
    );
    if (!sigRow || !sigRow.r2_key) {
      return { signatureRow: sigRow || null, dataUrl: null };
    }
    const buf = readPrivateR2File(sigRow.r2_key);
    if (!buf) {
      return { signatureRow: sigRow, dataUrl: null };
    }
    return {
      signatureRow: sigRow,
      dataUrl: `data:image/png;base64,${buf.toString('base64')}`,
    };
  }

  function getActiveSignatureRecord(store: any): {
    signatureRow: any | null;
    dataUrl: string | null;
  } {
    ensureCertificateStoreArrays(store);
    const active = store.certificateSignatures.find((s: any) => Number(s.active) === 1);
    if (!active) return { signatureRow: null, dataUrl: null };
    return getSignatureDataUrlForVersion(store, Number(active.version));
  }

  function resolveMockNumberForTest(store: any, test: any): number {
    if (typeof test.mockNumber === 'number' && test.mockNumber > 0) return test.mockNumber;
    if (typeof test.mock_number === 'number' && test.mock_number > 0) return test.mock_number;
    const sorted = [...(store.captainTests || [])].sort(
      (a: any, b: any) => (a.createdAt || 0) - (b.createdAt || 0)
    );
    const idx = sorted.findIndex((t: any) => t.id === test.id);
    const num = idx >= 0 ? idx + 1 : 1;
    test.mockNumber = num;
    test.mock_number = num;
    return num;
  }

  function generateNextCertificateSerial(store: any, mockNumber: number): string {
    ensureCertificateStoreArrays(store);
    const mockPad = String(Math.max(1, Math.floor(mockNumber))).padStart(2, '0');
    const prefix = `BDLY-GL${mockPad}-`;
    let maxSeq = 0;
    for (const cert of store.certificates) {
      const s = String(cert.serial || '');
      if (s.startsWith(prefix)) {
        const tail = Number(s.slice(prefix.length));
        if (Number.isFinite(tail) && tail > maxSeq) {
          maxSeq = tail;
        }
      }
    }
    let nextSeq = maxSeq + 1;
    let candidate = `${prefix}${String(nextSeq).padStart(4, '0')}`;
    while (store.certificates.some((c: any) => c.serial === candidate)) {
      nextSeq += 1;
      candidate = `${prefix}${String(nextSeq).padStart(4, '0')}`;
    }
    return candidate;
  }

  async function renderAndPersistCertificateRow(store: any, certRow: any): Promise<void> {
    const test = store.captainTests.find((t: any) => t.id === certRow.grand_line_id);
    const preferredThemeId =
      certRow.theme_id && certRow.theme_id !== 'auto'
        ? certRow.theme_id
        : test?.certificateThemeId ?? test?.certificate_theme_id ?? null;
    const resolvedTheme = resolveCertificateTheme(certRow.grand_line_id, preferredThemeId);

    const { signatureRow, dataUrl } = getSignatureDataUrlForVersion(
      store,
      Number(certRow.signature_version || 0)
    );

    const rendered = await renderCertificateFilesOnServer({
      serial: certRow.serial,
      studentName: certRow.student_name,
      grandLineId: certRow.grand_line_id,
      grandLineTitle: certRow.grand_line_title,
      editionLabel:
        certRow.edition_label ||
        test?.editionLabel ||
        `${test?.subject || 'Grand Line'} Official Mock`,
      rank: Number(certRow.rank || 1),
      score: Number(certRow.score || 0),
      totalQuestions: Number(certRow.total_questions || 0),
      percentage: Number(certRow.percentage || 0),
      participantsCount: Number(certRow.participants_count || 1),
      issuedAt: Number(certRow.issued_at || Date.now()),
      themeId: resolvedTheme.id,
      signatoryName: signatureRow?.signatory_name || 'Boardly Examination Council',
      signatoryTitle: signatureRow?.signatory_title || 'Founder, Boardly',
      signatureDataUrl: dataUrl,
      verifyBaseUrl: process.env.APP_URL || 'https://boardly.cfd',
    });

    writePrivateR2File(certRow.png_r2_key, rendered.pngBuffer);
    writePrivateR2File(certRow.pdf_r2_key, rendered.pdfBuffer);
  }

  async function finaliseGrandLineMockAndIssueCertificates(
    store: any,
    test: any
  ): Promise<{
    alreadyFinalised: boolean;
    issuedCertificates: any[];
    existingCertificates: any[];
    participantsCount: number;
  }> {
    ensureCertificateStoreArrays(store);
    const now = Date.now();
    const wasAlreadyFinalised = Boolean(test.resultsFinalised || test.results_finalised);
    test.resultsFinalised = 1;
    test.results_finalised = 1;
    if (!test.finalisedAt && !test.finalised_at) {
      test.finalisedAt = now;
      test.finalised_at = now;
    }

    const mockNumber = resolveMockNumberForTest(store, test);
    const attemptsForTest = store.testAttempts.filter(
      (a: any) =>
        String(a.testId || a.test_id || '') === String(test.id) &&
        String(a.userUid || a.user_uid || '').trim().length > 0
    );

    const participantsCount = attemptsForTest.length;
    if (participantsCount === 0) {
      saveD1Store(store);
      return {
        alreadyFinalised: wasAlreadyFinalised,
        issuedCertificates: [],
        existingCertificates: store.certificates.filter((c: any) => c.grand_line_id === test.id),
        participantsCount: 0,
      };
    }

    // Find highest score among all verified attempts for this Grand Line mock (ties for 1st all get rank = 1)
    let topScore = -1;
    for (const att of attemptsForTest) {
      const s = Number(att.score ?? 0);
      if (s > topScore) {
        topScore = s;
      }
    }

    const firstPlaceAttempts = attemptsForTest
      .filter((att: any) => Number(att.score ?? 0) === topScore)
      .sort((a: any, b: any) => Number(a.createdAt || 0) - Number(b.createdAt || 0));

    const { signatureRow: activeSig } = getActiveSignatureRecord(store);
    const activeSigVersion = activeSig ? Number(activeSig.version) : 0;
    const preferredThemeId = test.certificateThemeId ?? test.certificate_theme_id ?? null;
    const themeIdToSave =
      preferredThemeId && String(preferredThemeId).trim() !== 'auto'
        ? String(preferredThemeId).trim()
        : 'auto';
    const editionLabel =
      test.editionLabel ||
      test.edition_label ||
      `EDITION #${String(mockNumber).padStart(2, '0')} · ${String(test.subject || 'GENERAL').toUpperCase()}`;

    const issuedCertificates: any[] = [];
    const existingCertificates: any[] = [];

    for (const winnerAttempt of firstPlaceAttempts) {
      const studentUid = String(winnerAttempt.userUid || winnerAttempt.user_uid || '').trim();
      if (!studentUid) continue;

      const studentName = resolveLeaderboardDisplayName(winnerAttempt, store);
      const roleEntry = (store.userRoles || []).find((r: any) => r.uid === studentUid);
      const studentEmail = String(
        winnerAttempt.userEmail || winnerAttempt.studentEmail || roleEntry?.email || ''
      )
        .trim()
        .toLowerCase();

      const score = Math.max(0, Number(winnerAttempt.score || 0));
      const totalQuestions = Math.max(
        0,
        Number(
          winnerAttempt.totalQuestions ||
            winnerAttempt.total_questions ||
            test.questionCount ||
            test.question_count ||
            test.questions?.length ||
            0
        )
      );
      const percentage =
        totalQuestions > 0
          ? Math.max(0, Math.min(100, Math.round((score / totalQuestions) * 100)))
          : Math.max(0, Math.min(100, Math.round(Number(winnerAttempt.percentage ?? 0))));

      // Idempotency: UNIQUE(student_uid, grand_line_id) -> update existing record on re-check
      const existingCert = store.certificates.find(
        (c: any) => c.student_uid === studentUid && c.grand_line_id === test.id
      );
      if (existingCert) {
        if (studentName && studentName !== 'Student') {
          existingCert.student_name = studentName;
        }
        if (studentEmail) {
          existingCert.student_email = studentEmail;
        }
        existingCert.grand_line_title = test.title;
        existingCert.edition_label = editionLabel;
        existingCert.score = score;
        existingCert.total_questions = totalQuestions;
        existingCert.percentage = percentage;
        existingCert.participants_count = participantsCount;
        existingCert.theme_id = themeIdToSave;
        existingCert.signature_version = activeSigVersion;
        await renderAndPersistCertificateRow(store, existingCert);
        existingCertificates.push(existingCert);
        continue;
      }

      const serial = generateNextCertificateSerial(store, mockNumber);
      const certId = `cert_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;

      const pdfR2Key = `certificates/${test.id}/${serial}.pdf`;
      const pngR2Key = `certificates/${test.id}/${serial}.png`;

      const certRow = {
        id: certId,
        student_uid: studentUid,
        student_name: studentName,
        student_email: studentEmail,
        grand_line_id: test.id,
        grand_line_title: test.title,
        edition_label: editionLabel,
        rank: 1,
        score,
        total_questions: totalQuestions,
        percentage,
        participants_count: participantsCount,
        serial,
        theme_id: themeIdToSave,
        signature_version: activeSigVersion,
        issued_at: now,
        pdf_r2_key: pdfR2Key,
        png_r2_key: pngR2Key,
        status: 'active' as const,
      };

      await renderAndPersistCertificateRow(store, certRow);
      store.certificates.unshift(certRow);
      issuedCertificates.push(certRow);

      // Dispatch notification + Resend email ("You took 1st position")
      const appUrl = (process.env.APP_URL || 'https://boardly.cfd').replace(/\/+$/, '');
      const signedPreview = createSignedCertificateDownloadToken({
        certificateId: certRow.id,
        format: 'png',
      });
      const signedPdf = createSignedCertificateDownloadToken({
        certificateId: certRow.id,
        format: 'pdf',
      });
      const pngPreviewUrl = `${appUrl}/api/certificates/${encodeURIComponent(
        certRow.id
      )}/download?format=png&inline=1&token=${signedPreview.token}&exp=${signedPreview.exp}`;
      const downloadPdfUrl = `${appUrl}/api/certificates/${encodeURIComponent(
        certRow.id
      )}/download?format=pdf&token=${signedPdf.token}&exp=${signedPdf.exp}`;
      const verifyUrl = `${appUrl}/verify/${encodeURIComponent(certRow.serial)}`;
      const scoreLabel = formatCertificateScoreText({
        serial: certRow.serial,
        studentName: certRow.student_name,
        grandLineId: certRow.grand_line_id,
        grandLineTitle: certRow.grand_line_title,
        score: certRow.score,
        totalQuestions: certRow.total_questions,
        percentage: certRow.percentage,
        participantsCount: certRow.participants_count,
        issuedAt: certRow.issued_at,
      });

      // Add in-app notification for student
      if (!Array.isArray(store.notifications)) store.notifications = [];
      store.notifications.unshift({
        id: `notif_cert_${certRow.id}`,
        user_id: studentUid,
        type: 'certificate_issued',
        title: `You took 1st position in ${test.title}!`,
        message: `Your Certificate of Excellence (${certRow.serial}) is ready to download in My Certificates.`,
        link: '/dashboard/certificates',
        read: 0,
        is_pinned: 1,
        author_id: null,
        author_name: 'Boardly Grand Line',
        author_avatar: null,
        author_frame: null,
        post_id: certRow.id,
        post_type: 'certificate',
        created_at: now,
        read_at: null,
      });

      // Record email dispatch (and send via Resend if RESEND_API_KEY is configured)
      const emailTpl = buildCertificateIssuedStudentEmail({
        studentName: certRow.student_name,
        mockTitle: certRow.grand_line_title,
        editionLabel: certRow.edition_label,
        scoreLabel,
        participantsCount: certRow.participants_count,
        serial: certRow.serial,
        issuedAt: certRow.issued_at,
        pngPreviewUrl,
        downloadPdfUrl,
        verifyUrl,
        appUrl,
      });

      if (!Array.isArray(store.certificateEmails)) store.certificateEmails = [];
      const resendKey = (process.env.RESEND_API_KEY || '').trim();
      let emailStatus: 'sent' | 'queued_local' | 'failed' = 'queued_local';
      let resendId: string | null = null;

      if (resendKey && studentEmail && studentEmail.includes('@')) {
        try {
          const emailResp = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${resendKey}`,
              'Content-Type': 'application/json',
              'Idempotency-Key': `certificate_issued:${certRow.serial}:student`,
            },
            body: JSON.stringify({
              from: process.env.EMAIL_FROM || 'Boardly <no-reply@boardly.cfd>',
              to: [studentEmail],
              subject: emailTpl.subject,
              html: emailTpl.html,
              text: emailTpl.text,
            }),
          });
          if (emailResp.ok) {
            const ej = (await emailResp.json().catch(() => ({}))) as any;
            resendId = ej?.id || null;
            emailStatus = 'sent';
          } else {
            emailStatus = 'failed';
          }
        } catch {
          emailStatus = 'failed';
        }
      }

      store.certificateEmails.unshift({
        id: `cert_email_${certRow.id}`,
        certificate_id: certRow.id,
        serial: certRow.serial,
        student_uid: studentUid,
        student_email: studentEmail,
        subject: emailTpl.subject,
        png_preview_url: pngPreviewUrl,
        download_pdf_url: downloadPdfUrl,
        verify_url: verifyUrl,
        status: emailStatus,
        resend_id: resendId,
        created_at: now,
      });
    }

    saveD1Store(store);
    return {
      alreadyFinalised: wasAlreadyFinalised,
      issuedCertificates,
      existingCertificates,
      participantsCount,
    };
  }

  // Block any direct public/student access to /api/signatures/*
  app.get('/api/signatures/*', (_req: Request, res: Response) => {
    return res.status(403).json({
      error: 'Forbidden: Signature files are private and can only be managed by admins on the server.',
      code: 'SIGNATURE_PRIVATE',
    });
  });

  // 1. GET /api/admin/signatures — Admin only: get active signature + version history + preview data URL
  app.get('/api/admin/signatures', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    }
    const store = loadD1Store() as any;
    ensureCertificateStoreArrays(store);
    const roleRow = resolveD1Role(store, user);
    if (!['admin', 'superadmin'].includes(roleRow.role)) {
      return res.status(403).json({
        error: 'Forbidden: Only admins can read or manage certificate signatures.',
        code: 'FORBIDDEN',
      });
    }

    const history = [...store.certificateSignatures]
      .sort((a: any, b: any) => Number(b.version || 0) - Number(a.version || 0))
      .map((row: any) => {
        const { dataUrl } = getSignatureDataUrlForVersion(store, Number(row.version));
        const imageUrl = `/api/admin/signatures/${encodeURIComponent(row.id)}/image`;
        return {
          id: row.id,
          version: Number(row.version),
          signatory_name: row.signatory_name,
          signatory_title: row.signatory_title,
          created_at: Number(row.created_at),
          uploaded_by: row.uploaded_by,
          signatoryName: row.signatory_name,
          signatoryTitle: row.signatory_title,
          createdAt: Number(row.created_at),
          uploadedBy: row.uploaded_by,
          active: Boolean(row.active),
          imageUrl,
          previewDataUrl: dataUrl || imageUrl,
        };
      });

    const activeSignature = history.find((h) => h.active) || null;
    return res.status(200).json({
      ok: true,
      hasActiveSignature: Boolean(activeSignature),
      activeSignature,
      history,
    });
  });

  // 2. POST /api/admin/signatures — Admin only: upload or draw signature, strip white bg & trim margins, save to private R2 & D1
  app.post('/api/admin/signatures', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    }
    const store = loadD1Store() as any;
    ensureCertificateStoreArrays(store);
    if (!hasAdminPermission(store, user, 'certificates.issue')) {
      return res.status(403).json({
        error: 'Permission denied: certificates.issue is required to upload or modify certificate signatures.',
        code: 'PERMISSION_DENIED',
        permission: 'certificates.issue',
      });
    }

    try {
      const body = req.body || {};
      const rawImage = String(body.imageBase64 || body.image || body.dataUrl || '').trim();
      const signatoryName = String(body.signatoryName ?? body.signatory_name ?? '')
        .trim()
        .slice(0, 120);
      const signatoryTitle = String(body.signatoryTitle ?? body.signatory_title ?? '')
        .trim()
        .slice(0, 140);

      if (!rawImage) {
        return res.status(400).json({
          error: 'Signature image data is required (PNG, JPG, or WebP).',
          code: 'MISSING_SIGNATURE_IMAGE',
        });
      }
      if (!signatoryName) {
        return res.status(400).json({
          error: 'Signatory name is required.',
          code: 'MISSING_SIGNATORY_NAME',
        });
      }
      if (!signatoryTitle) {
        return res.status(400).json({
          error: 'Signatory title is required.',
          code: 'MISSING_SIGNATORY_TITLE',
        });
      }

      // Extract base64 payload & validate mime
      let base64Data = rawImage;
      const dataUriMatch = /^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/i.exec(rawImage);
      if (dataUriMatch) {
        base64Data = dataUriMatch[2];
      } else if (rawImage.startsWith('data:')) {
        return res.status(400).json({
          error: 'Unsupported image format. Please upload PNG, JPG, or WebP.',
          code: 'INVALID_SIGNATURE_FORMAT',
        });
      }

      const rawBuffer = Buffer.from(base64Data, 'base64');
      if (rawBuffer.byteLength === 0) {
        return res.status(400).json({ error: 'Uploaded signature image is empty.', code: 'EMPTY_IMAGE' });
      }
      if (rawBuffer.byteLength > MAX_SIGNATURE_BYTES) {
        return res.status(413).json({
          error: 'Signature image exceeds the maximum allowed size of 2 MB.',
          code: 'FILE_TOO_LARGE',
        });
      }

      // Server-side white/near-white background removal & margin trimming
      const processed = await processSignatureImageBuffer(rawBuffer);

      const maxVersion = store.certificateSignatures.reduce(
        (max: number, row: any) => Math.max(max, Number(row.version || 0)),
        0
      );
      const nextVersion = maxVersion + 1;
      const now = Date.now();
      const sigId = crypto.randomUUID();
      const r2Key = `signatures/sig-v${nextVersion}-${now}.png`;

      // Store processed transparent PNG in private R2
      writePrivateR2File(r2Key, processed.pngBuffer);

      try {
        // Deactivate previous signatures (preserving version history for existing certificates)
        for (const s of store.certificateSignatures) {
          s.active = 0;
        }

        const newRecord = {
          id: sigId,
          r2_key: r2Key,
          signatory_name: signatoryName,
          signatory_title: signatoryTitle,
          version: nextVersion,
          uploaded_by: user.uid || user.email || 'admin',
          created_at: now,
          active: 1,
        };

        store.certificateSignatures.unshift(newRecord);
        saveD1Store(store);

        const imageUrl = `/api/admin/signatures/${encodeURIComponent(newRecord.id)}/image`;
        return res.status(201).json({
          ok: true,
          signature: {
            id: newRecord.id,
            version: newRecord.version,
            signatory_name: newRecord.signatory_name,
            signatory_title: newRecord.signatory_title,
            created_at: newRecord.created_at,
            signatoryName: newRecord.signatory_name,
            signatoryTitle: newRecord.signatory_title,
            createdAt: newRecord.created_at,
            uploadedBy: newRecord.uploaded_by,
            active: true,
            width: processed.width,
            height: processed.height,
            imageUrl,
            previewDataUrl: processed.dataUrl,
          },
        });
      } catch (d1Err: any) {
        // Delete orphaned R2 file if D1 write fails
        try {
          const orphanPath = resolvePrivateR2Path(r2Key);
          if (fs.existsSync(orphanPath)) fs.unlinkSync(orphanPath);
        } catch {
          // ignore cleanup failure
        }
        throw d1Err;
      }
    } catch (err: any) {
      return res.status(400).json({
        error: err?.message || 'Failed to process signature image.',
        code: 'SIGNATURE_PROCESS_FAILED',
      });
    }
  });

  // 2b. GET /api/admin/signatures/:id/image — Admin only: stream signature PNG from private R2
  app.get('/api/admin/signatures/:id/image', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    const store = loadD1Store() as any;
    ensureCertificateStoreArrays(store);
    const roleRow = resolveD1Role(store, user);
    if (!['admin', 'superadmin', 'super_admin'].includes(roleRow.role)) {
      return res.status(403).json({ error: 'Forbidden', code: 'FORBIDDEN' });
    }

    const sigId = decodeURIComponent(String(req.params.id || '')).trim();
    const sigRow =
      sigId === 'active'
        ? store.certificateSignatures.find((s: any) => Number(s.active) === 1)
        : store.certificateSignatures.find(
            (s: any) => s.id === sigId || String(s.version) === sigId
          );

    if (!sigRow || !sigRow.r2_key) {
      return res.status(404).json({ error: 'Signature not found.', code: 'NOT_FOUND' });
    }

    const buf = readPrivateR2File(sigRow.r2_key);
    if (!buf) {
      return res.status(404).json({ error: 'Signature image not found in private R2.', code: 'NOT_FOUND' });
    }

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.setHeader('Content-Length', String(buf.byteLength));
    return res.status(200).send(buf);
  });

  // 3. PUT /api/admin/signatures/active — Admin only: update signatory name/title on active signature
  app.put('/api/admin/signatures/active', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    const store = loadD1Store() as any;
    ensureCertificateStoreArrays(store);
    if (!hasAdminPermission(store, user, 'certificates.issue')) {
      return res.status(403).json({
        error: 'Permission denied: certificates.issue is required.',
        code: 'PERMISSION_DENIED',
        permission: 'certificates.issue',
      });
    }

    const active = store.certificateSignatures.find((s: any) => Number(s.active) === 1);
    if (!active) {
      return res.status(404).json({ error: 'No active signature found.', code: 'NOT_FOUND' });
    }

    const body = req.body || {};
    if (body.signatoryName !== undefined || body.signatory_name !== undefined) {
      active.signatory_name =
        String(body.signatoryName ?? body.signatory_name ?? '').trim().slice(0, 120) ||
        active.signatory_name;
    }
    if (body.signatoryTitle !== undefined || body.signatory_title !== undefined) {
      active.signatory_title = String(body.signatoryTitle ?? body.signatory_title ?? '')
        .trim()
        .slice(0, 140);
    }
    saveD1Store(store);

    const { dataUrl } = getSignatureDataUrlForVersion(store, Number(active.version));
    const imageUrl = `/api/admin/signatures/${encodeURIComponent(active.id)}/image`;
    return res.status(200).json({
      ok: true,
      signature: {
        id: active.id,
        version: Number(active.version),
        signatory_name: active.signatory_name,
        signatory_title: active.signatory_title,
        created_at: Number(active.created_at),
        signatoryName: active.signatory_name,
        signatoryTitle: active.signatory_title,
        createdAt: Number(active.created_at),
        uploadedBy: active.uploaded_by,
        active: true,
        imageUrl,
        previewDataUrl: dataUrl || imageUrl,
      },
    });
  });

  // 4. POST /api/admin/signatures/:version/restore — Admin only: restore a previous signature version
  app.post('/api/admin/signatures/:version/restore', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    const store = loadD1Store() as any;
    ensureCertificateStoreArrays(store);
    if (!hasAdminPermission(store, user, 'certificates.issue')) {
      return res.status(403).json({
        error: 'Permission denied: certificates.issue is required.',
        code: 'PERMISSION_DENIED',
        permission: 'certificates.issue',
      });
    }

    const targetParam = decodeURIComponent(String(req.params.version || '')).trim();
    const targetVersion = Number(targetParam);
    const targetRow = store.certificateSignatures.find(
      (s: any) => Number(s.version) === targetVersion || s.id === targetParam
    );
    if (!targetRow) {
      return res.status(404).json({ error: 'Signature version not found.', code: 'NOT_FOUND' });
    }

    for (const s of store.certificateSignatures) {
      s.active = s.id === targetRow.id ? 1 : 0;
    }
    saveD1Store(store);

    const { dataUrl } = getSignatureDataUrlForVersion(store, Number(targetRow.version));
    const imageUrl = `/api/admin/signatures/${encodeURIComponent(targetRow.id)}/image`;
    return res.status(200).json({
      ok: true,
      activeSignature: {
        id: targetRow.id,
        version: Number(targetRow.version),
        signatory_name: targetRow.signatory_name,
        signatory_title: targetRow.signatory_title,
        created_at: Number(targetRow.created_at),
        signatoryName: targetRow.signatory_name,
        signatoryTitle: targetRow.signatory_title,
        createdAt: Number(targetRow.created_at),
        uploadedBy: targetRow.uploaded_by,
        active: true,
        imageUrl,
        previewDataUrl: dataUrl || imageUrl,
      },
    });
  });

  // 5. DELETE /api/admin/signatures/active — Admin only: remove active signature (keeps version history in D1/R2)
  app.delete('/api/admin/signatures/active', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    const store = loadD1Store() as any;
    ensureCertificateStoreArrays(store);
    if (!hasAdminPermission(store, user, 'certificates.issue')) {
      return res.status(403).json({
        error: 'Permission denied: certificates.issue is required.',
        code: 'PERMISSION_DENIED',
        permission: 'certificates.issue',
      });
    }

    for (const s of store.certificateSignatures) {
      s.active = 0;
    }
    saveD1Store(store);
    return res.status(200).json({ ok: true, hasActiveSignature: false });
  });

  // 5b. DELETE /api/admin/signatures/:id — Admin only: block deleting signature used by issued certificate; otherwise deactivate and re-activate previous version
  app.delete('/api/admin/signatures/:id', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    const store = loadD1Store() as any;
    ensureCertificateStoreArrays(store);
    if (!hasAdminPermission(store, user, 'certificates.issue')) {
      return res.status(403).json({
        error: 'Permission denied: certificates.issue is required.',
        code: 'PERMISSION_DENIED',
        permission: 'certificates.issue',
      });
    }

    const targetId = decodeURIComponent(String(req.params.id || '')).trim();
    if (targetId === 'active') {
      for (const s of store.certificateSignatures) {
        s.active = 0;
      }
      saveD1Store(store);
      return res.status(200).json({ ok: true, hasActiveSignature: false });
    }

    const sigRow = store.certificateSignatures.find(
      (s: any) => s.id === targetId || String(s.version) === targetId
    );
    if (!sigRow) {
      return res.status(404).json({ error: 'Signature not found.', code: 'NOT_FOUND' });
    }

    const usedCount = store.certificates.filter(
      (c: any) => Number(c.signature_version) === Number(sigRow.version)
    ).length;
    if (usedCount > 0) {
      return res.status(409).json({
        error: `Cannot delete signature v${sigRow.version} because it is already used by ${usedCount} issued certificate(s).`,
        code: 'SIGNATURE_IN_USE',
      });
    }

    const wasActive = Boolean(sigRow.active);
    sigRow.active = 0;

    let reactivatedSignature: any = null;
    if (wasActive) {
      const remaining = [...store.certificateSignatures]
        .filter((s: any) => s.id !== sigRow.id)
        .sort((a: any, b: any) => Number(b.version || 0) - Number(a.version || 0));
      const prevRow = remaining[0];
      if (prevRow) {
        prevRow.active = 1;
        const { dataUrl } = getSignatureDataUrlForVersion(store, Number(prevRow.version));
        const imageUrl = `/api/admin/signatures/${encodeURIComponent(prevRow.id)}/image`;
        reactivatedSignature = {
          id: prevRow.id,
          version: Number(prevRow.version),
          signatory_name: prevRow.signatory_name,
          signatory_title: prevRow.signatory_title,
          created_at: Number(prevRow.created_at),
          signatoryName: prevRow.signatory_name,
          signatoryTitle: prevRow.signatory_title,
          createdAt: Number(prevRow.created_at),
          active: true,
          imageUrl,
          previewDataUrl: dataUrl || imageUrl,
        };
      }
    }

    saveD1Store(store);
    return res.status(200).json({
      ok: true,
      deactivatedId: sigRow.id,
      deactivatedVersion: Number(sigRow.version),
      activeSignature: reactivatedSignature,
      hasActiveSignature: Boolean(reactivatedSignature),
    });
  });

  // 6. POST /api/tests/:id/finalise — Finalise Grand Line mock results & issue 1st-position certificate(s)
  app.post('/api/tests/:id/finalise', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    const store = loadD1Store() as any;
    ensureCertificateStoreArrays(store);

    const rawId = decodeURIComponent(String(req.params.id || '')).trim();
    const altId = rawId.replace(/-/g, '_');
    const test = store.captainTests.find((t: any) => t.id === rawId || t.id === altId);
    const resolvedTargetId = test ? test.id : rawId;

    const hasCertPerm = hasAdminPermission(store, user, 'certificates.issue', { targetId: resolvedTargetId });
    if (!hasCertPerm && (!test || test.captainUid !== user.uid)) {
      return res.status(403).json({
        error: 'Permission denied: certificates.issue is required to finalise results and issue certificates.',
        code: 'PERMISSION_DENIED',
        permission: 'certificates.issue',
      });
    }

    if (!test) return res.status(404).json({ error: 'Grand Line mock not found.', code: 'NOT_FOUND' });

    const body = req.body || {};
    if (body.certificateThemeId !== undefined || body.certificate_theme_id !== undefined) {
      const rawTheme = body.certificateThemeId !== undefined ? body.certificateThemeId : body.certificate_theme_id;
      const cleanTheme =
        typeof rawTheme === 'string' && rawTheme.trim() && rawTheme.trim() !== 'auto'
          ? rawTheme.trim()
          : null;
      test.certificateThemeId = cleanTheme;
      test.certificate_theme_id = cleanTheme;
    }

    const outcome = await finaliseGrandLineMockAndIssueCertificates(store, test);
    const mapCert = (c: any) => ({
      ...c,
      studentUid: c.student_uid,
      studentName: c.student_name,
      grandLineId: c.grand_line_id,
      grandLineTitle: c.grand_line_title,
      editionLabel: c.edition_label,
      totalQuestions: Number(c.total_questions || 0),
      participantsCount: Number(c.participants_count || 1),
      themeId: c.theme_id,
      signatureVersion: Number(c.signature_version || 0),
      issuedAt: Number(c.issued_at),
    });
    return res.status(200).json({
      ok: true,
      testId: test.id,
      resultsFinalised: true,
      alreadyFinalised: outcome.alreadyFinalised,
      participantsCount: outcome.participantsCount,
      issuedCount: outcome.issuedCertificates.length,
      existingCount: outcome.existingCertificates.length,
      certificates: [...outcome.issuedCertificates, ...outcome.existingCertificates].map(mapCert),
    });
  });

  // 7. GET /api/certificates/mine — Authenticated student: list own certificates
  app.get('/api/certificates/mine', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    const store = loadD1Store() as any;
    ensureCertificateStoreArrays(store);

    const { signatureRow: activeSig, dataUrl: activeSigDataUrl } = getActiveSignatureRecord(store);
    let dirty = false;

    const myCerts = store.certificates
      .filter((c: any) => c.student_uid === user.uid && c.status === 'active')
      .sort((a: any, b: any) => Number(b.issued_at || 0) - Number(a.issued_at || 0))
      .map((c: any) => {
        let score = Math.max(0, Number(c.score || 0));
        let totalQuestions = Math.max(0, Number(c.total_questions || 0));
        let studentName = String(c.student_name || '').trim();

        const matchingAttempts = (store.testAttempts || []).filter(
          (a: any) =>
            String(a.testId || a.test_id || '') === String(c.grand_line_id) &&
            String(a.userUid || a.user_uid || '') === String(c.student_uid)
        );
        if (matchingAttempts.length > 0) {
          const bestAtt = [...matchingAttempts].sort(
            (a: any, b: any) => Number(b.score || 0) - Number(a.score || 0)
          )[0];
          if (bestAtt) {
            const attScore = Math.max(0, Number(bestAtt.score || 0));
            const attTotal = Math.max(
              0,
              Number(bestAtt.totalQuestions || bestAtt.total_questions || totalQuestions || 0)
            );
            if (score === 0 && attScore > 0) {
              score = attScore;
              c.score = score;
              dirty = true;
            }
            if (attTotal > 0 && (totalQuestions === 0 || totalQuestions === 100)) {
              totalQuestions = attTotal;
              c.total_questions = totalQuestions;
              dirty = true;
            }
            if (!studentName || studentName.toLowerCase() === 'student') {
              const resolvedName = resolveLeaderboardDisplayName(bestAtt, store);
              if (resolvedName && resolvedName !== 'Student') {
                studentName = resolvedName;
                c.student_name = studentName;
                dirty = true;
              }
            }
          }
        }

        if (!studentName || studentName.toLowerCase() === 'student') {
          const fallbackName = resolveLeaderboardDisplayName(
            { userUid: user.uid, userName: (user as any).name || '', userEmail: user.email || '' },
            store
          );
          if (fallbackName && fallbackName !== 'Student') {
            studentName = fallbackName;
            c.student_name = studentName;
            dirty = true;
          } else {
            studentName = 'Student';
          }
        }

        const percentage =
          totalQuestions > 0
            ? Math.max(0, Math.min(100, Math.round((score / totalQuestions) * 100)))
            : Math.max(0, Math.min(100, Math.round(Number(c.percentage ?? 0))));
        if (percentage !== Number(c.percentage || 0)) {
          c.percentage = percentage;
          dirty = true;
        }

        const signedPng = createSignedCertificateDownloadToken({
          certificateId: c.id,
          format: 'png',
        });
        const signedPdf = createSignedCertificateDownloadToken({
          certificateId: c.id,
          format: 'pdf',
        });
        const theme = resolveCertificateTheme(
          c.grand_line_id,
          c.theme_id,
          c.student_uid || c.serial || studentName
        );
        return {
          id: c.id,
          serial: c.serial,
          serialNumber: c.serial,
          studentUid: c.student_uid,
          studentName,
          studentEmail: c.student_email || user.email || '',
          grandLineId: c.grand_line_id,
          grandLineTitle: c.grand_line_title,
          testTitle: c.grand_line_title,
          editionLabel: c.edition_label,
          rank: Number(c.rank || 1),
          score,
          scoreObtained: score,
          totalQuestions,
          totalMarks: totalQuestions,
          percentage,
          participantsCount: Number(c.participants_count || 1),
          themeId: c.theme_id || 'auto',
          paletteSeed: c.student_uid || c.serial,
          theme,
          signatureVersion: Number(c.signature_version || activeSig?.version || 1),
          signatoryName: activeSig?.signatory_name || 'Boardly Examination Council',
          signatoryTitle: activeSig?.signatory_title || 'Founder, Boardly',
          signatureDataUrl: activeSigDataUrl || null,
          issuedAt: Number(c.issued_at),
          status: c.status,
          verifyUrl: `/verify/${encodeURIComponent(c.serial)}`,
          previewPngUrl: `/api/certificates/${encodeURIComponent(c.id)}/download?format=png&inline=1&token=${signedPng.token}&exp=${signedPng.exp}`,
          downloadPngUrl: `/api/certificates/${encodeURIComponent(c.id)}/download?format=png&token=${signedPng.token}&exp=${signedPng.exp}`,
          downloadPdfUrl: `/api/certificates/${encodeURIComponent(c.id)}/download?format=pdf&token=${signedPdf.token}&exp=${signedPdf.exp}`,
        };
      });

    if (dirty) {
      saveD1Store(store);
    }

    return res.status(200).json({ certificates: myCerts });
  });

  // 8. GET /api/certificates/:id/download — Authenticated owner, Admin, or short-lived signed token download
  app.get('/api/certificates/:id/download', async (req: Request, res: Response) => {
    const store = loadD1Store() as any;
    ensureCertificateStoreArrays(store);

    const certId = decodeURIComponent(String(req.params.id || '')).trim();
    const formatRaw = String(req.query.format || 'pdf').trim().toLowerCase();
    const format: 'pdf' | 'png' = formatRaw === 'png' ? 'png' : 'pdf';
    const isInline = req.query.inline === '1' || req.query.inline === 'true';

    const cert = store.certificates.find(
      (c: any) => c.id === certId || c.serial === certId
    );
    if (!cert) {
      return res.status(404).json({ error: 'Certificate not found.', code: 'NOT_FOUND' });
    }

    // Check short-lived signed token OR authenticated session
    const tokenParam = String(req.query.token || '').trim();
    const expParam = String(req.query.exp || '').trim();
    const hasValidSignedToken =
      tokenParam.length > 0 &&
      verifySignedCertificateDownloadToken({
        certificateId: cert.id,
        format,
        token: tokenParam,
        exp: expParam,
      });

    let isAdmin = false;
    let isOwner = false;

    if (!hasValidSignedToken) {
      const user = await verifyFirebaseJwtZeroFirestore(req);
      if (!user) {
        return res.status(401).json({
          error: 'Authentication required to download this certificate.',
          code: 'UNAUTHENTICATED',
        });
      }
      const roleRow = resolveD1Role(store, user);
      isAdmin = ['admin', 'superadmin'].includes(roleRow.role);
      isOwner = user.uid === cert.student_uid;

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          error: 'Forbidden: You can only download certificates issued to your own account.',
          code: 'FORBIDDEN',
        });
      }
    }

    if (cert.status === 'revoked' && !isAdmin) {
      return res.status(403).json({
        error: 'This certificate has been revoked and is no longer available for download.',
        code: 'CERTIFICATE_REVOKED',
      });
    }

    const r2Key = format === 'png' ? cert.png_r2_key : cert.pdf_r2_key;
    let fileBuffer = readPrivateR2File(r2Key);
    if (!fileBuffer) {
      await renderAndPersistCertificateRow(store, cert);
      fileBuffer = readPrivateR2File(r2Key);
    }

    if (!fileBuffer) {
      return res.status(500).json({ error: 'Failed to render certificate file.', code: 'RENDER_ERROR' });
    }

    const mime = format === 'png' ? 'image/png' : 'application/pdf';
    const disposition = isInline
      ? `inline; filename="${cert.serial}.${format}"`
      : `attachment; filename="${cert.serial}.${format}"`;

    res.setHeader('Content-Type', mime);
    res.setHeader('Cache-Control', 'private, no-store, no-cache, must-revalidate');
    res.setHeader('Content-Disposition', disposition);
    res.setHeader('Content-Length', String(fileBuffer.byteLength));
    return res.status(200).send(fileBuffer);
  });

  // 9. POST /api/certificates/:id/share-link — Generate short-lived signed share/download links & public verify URL
  app.post('/api/certificates/:id/share-link', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    const store = loadD1Store() as any;
    ensureCertificateStoreArrays(store);

    const certId = decodeURIComponent(String(req.params.id || '')).trim();
    const cert = store.certificates.find((c: any) => c.id === certId || c.serial === certId);
    if (!cert) return res.status(404).json({ error: 'Certificate not found.', code: 'NOT_FOUND' });

    const roleRow = resolveD1Role(store, user);
    const isAdmin = ['admin', 'superadmin'].includes(roleRow.role);
    if (cert.student_uid !== user.uid && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden', code: 'FORBIDDEN' });
    }

    const expMs = Date.now() + 1000 * 60 * 60 * 24; // 24h short-lived signed link
    const signedPng = createSignedCertificateDownloadToken({
      certificateId: cert.id,
      format: 'png',
      expiresAtMs: expMs,
    });
    const signedPdf = createSignedCertificateDownloadToken({
      certificateId: cert.id,
      format: 'pdf',
      expiresAtMs: expMs,
    });

    return res.status(200).json({
      ok: true,
      serial: cert.serial,
      verifyUrl: `/verify/${encodeURIComponent(cert.serial)}`,
      signedPngUrl: `/api/certificates/${encodeURIComponent(cert.id)}/download?format=png&token=${signedPng.token}&exp=${signedPng.exp}`,
      signedPdfUrl: `/api/certificates/${encodeURIComponent(cert.id)}/download?format=pdf&token=${signedPdf.token}&exp=${signedPdf.exp}`,
      expiresAt: expMs,
    });
  });

  // 10. GET /api/verify/:serial — Public verification endpoint (returns ONLY safe fields, never signature or UID/email)
  app.get('/api/verify/:serial', (req: Request, res: Response) => {
    const store = loadD1Store() as any;
    ensureCertificateStoreArrays(store);

    const rawSerial = decodeURIComponent(String(req.params.serial || '')).trim().toUpperCase();
    if (!rawSerial) {
      return res.status(400).json({ valid: false, status: 'invalid', error: 'Serial number is required.' });
    }

    const cert = store.certificates.find(
      (c: any) => String(c.serial || '').trim().toUpperCase() === rawSerial
    );

    if (!cert) {
      return res.status(404).json({
        valid: false,
        status: 'not_found',
        serial: rawSerial,
        error: 'No certificate found with this serial number.',
      });
    }

    const { signatureRow: activeSig } = getActiveSignatureRecord(store);
    const score = Math.max(0, Number(cert.score || 0));
    const totalQuestions = Math.max(0, Number(cert.total_questions || 0));
    const percentage =
      totalQuestions > 0
        ? Math.max(0, Math.min(100, Math.round((score / totalQuestions) * 100)))
        : Math.max(0, Math.min(100, Math.round(Number(cert.percentage ?? 0))));

    const isRevoked = cert.status === 'revoked';
    const safeCertificate = {
      serial: cert.serial,
      status: (isRevoked ? 'revoked' : 'active') as 'active' | 'revoked',
      studentUid: cert.student_uid,
      studentName: cert.student_name,
      grandLineId: cert.grand_line_id,
      mockTitle: cert.grand_line_title,
      grandLineTitle: cert.grand_line_title,
      editionLabel: cert.edition_label,
      rank: Number(cert.rank || 1),
      score,
      totalQuestions,
      percentage,
      participantsCount: Number(cert.participants_count || 1),
      themeId: cert.theme_id || 'auto',
      signatoryName: activeSig?.signatory_name || 'Boardly Examination Council',
      signatoryTitle: activeSig?.signatory_title || 'Founder, Boardly',
      issuedAt: Number(cert.issued_at),
    };
    return res.status(200).json({
      valid: !isRevoked,
      ...safeCertificate,
      certificate: safeCertificate,
    });
  });

  // 10b. GET /api/admin/certificates/preview — Admin only: return sample certificate preview (JSON or SVG) with active signature
  app.get('/api/admin/certificates/preview', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    const store = loadD1Store() as any;
    ensureCertificateStoreArrays(store);
    const roleRow = resolveD1Role(store, user);
    if (!['admin', 'superadmin', 'super_admin'].includes(roleRow.role)) {
      return res.status(403).json({ error: 'Forbidden: Admin access required.', code: 'FORBIDDEN' });
    }

    const format = String(req.query.format || 'json').trim().toLowerCase();
    const themeId = String(req.query.themeId || 'default').trim() || 'default';
    const { signatureRow: activeSig, dataUrl: activeSigDataUrl } = getActiveSignatureRecord(store);

    const previewPayload = {
      serial: 'BRD-PREVIEW',
      studentName: String(req.query.studentName || 'Sample Student'),
      grandLineId: 'default',
      grandLineTitle: String(req.query.grandLineTitle || 'Grand Line Mock 1'),
      editionLabel: 'EDITION #01 · GRAND LINE',
      rank: 1,
      score: 192,
      totalQuestions: 200,
      percentage: 96,
      participantsCount: 512,
      issuedAt: Number(activeSig?.created_at || Date.now()),
      themeId,
      signatoryName: activeSig?.signatory_name || 'Boardly Examination Council',
      signatoryTitle: activeSig?.signatory_title || 'Founder, Boardly',
      signatureVersion: Number(activeSig?.version || 1),
      signatureDataUrl: activeSigDataUrl || null,
    };

    res.setHeader('Cache-Control', 'private, no-store');
    if (format === 'svg') {
      const svg = buildCertificateSvgMarkup(previewPayload);
      res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
      return res.status(200).send(svg);
    }

    return res.status(200).json({
      ok: true,
      preview: previewPayload,
    });
  });

  // 11. GET /api/admin/certificates — Admin only: list all certificates, active signature status, and mocks
  app.get('/api/admin/certificates', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    const store = loadD1Store() as any;
    ensureCertificateStoreArrays(store);
    const roleRow = resolveD1Role(store, user);
    if (!['admin', 'superadmin', 'super_admin'].includes(roleRow.role)) {
      return res.status(403).json({ error: 'Forbidden: Admin access required.', code: 'FORBIDDEN' });
    }
    const canSeeStudentEmails = hasAdminPermission(store, user, 'users.view', { consumeOnce: false });

    const search = String(req.query.search || req.query.q || '').trim().toLowerCase();
    const statusFilter = String(req.query.status || '').trim().toLowerCase();
    const grandLineFilter = String(req.query.grandLineId || '').trim();

    const { signatureRow: activeSig, dataUrl: activeSigDataUrl } = getActiveSignatureRecord(store);

    const list = store.certificates
      .filter((c: any) => {
        if (statusFilter && statusFilter !== 'all' && c.status !== statusFilter) return false;
        if (grandLineFilter && grandLineFilter !== 'all' && c.grand_line_id !== grandLineFilter) return false;
        if (search) {
          const hay = `${c.student_name} ${canSeeStudentEmails ? c.student_email : ''} ${c.serial} ${c.grand_line_title}`.toLowerCase();
          if (!hay.includes(search)) return false;
        }
        return true;
      })
      .sort((a: any, b: any) => Number(b.issued_at || 0) - Number(a.issued_at || 0))
      .map((c: any) => {
        const score = Math.max(0, Number(c.score || 0));
        const totalQuestions = Math.max(0, Number(c.total_questions || 0));
        const percentage =
          totalQuestions > 0
            ? Math.max(0, Math.min(100, Math.round((score / totalQuestions) * 100)))
            : Math.max(0, Math.min(100, Math.round(Number(c.percentage ?? 0))));
        const signedPng = createSignedCertificateDownloadToken({
          certificateId: c.id,
          format: 'png',
        });
        const signedPdf = createSignedCertificateDownloadToken({
          certificateId: c.id,
          format: 'pdf',
        });
        return {
          id: c.id,
          serial: c.serial,
          serialNumber: c.serial,
          studentUid: canSeeStudentEmails ? c.student_uid : undefined,
          studentName: c.student_name,
          studentEmail: canSeeStudentEmails ? c.student_email : undefined,
          grandLineId: c.grand_line_id,
          grandLineTitle: c.grand_line_title,
          testTitle: c.grand_line_title,
          editionLabel: c.edition_label,
          rank: Number(c.rank || 1),
          score,
          scoreObtained: score,
          totalQuestions,
          totalMarks: totalQuestions,
          percentage,
          participantsCount: Number(c.participants_count || 1),
          themeId: c.theme_id || 'auto',
          paletteSeed: c.student_uid || c.serial,
          signatureVersion: Number(c.signature_version || activeSig?.version || 1),
          signatoryName: activeSig?.signatory_name || 'Boardly Examination Council',
          signatoryTitle: activeSig?.signatory_title || 'Founder, Boardly',
          signatureDataUrl: activeSigDataUrl || null,
          issuedAt: Number(c.issued_at),
          status: c.status,
          verifyUrl: `/verify/${encodeURIComponent(c.serial)}`,
          previewPngUrl: `/api/certificates/${encodeURIComponent(c.id)}/download?format=png&inline=1&token=${signedPng.token}&exp=${signedPng.exp}`,
          downloadPngUrl: `/api/certificates/${encodeURIComponent(c.id)}/download?format=png&token=${signedPng.token}&exp=${signedPng.exp}`,
          downloadPdfUrl: `/api/certificates/${encodeURIComponent(c.id)}/download?format=pdf&token=${signedPdf.token}&exp=${signedPdf.exp}`,
        };
      });

    const nowMs = Date.now();
    const mocks = (store.captainTests || []).map((t: any) => ({
      id: t.id,
      title: t.title,
      subject: t.subject,
      status: t.status,
      visibility: t.visibility,
      attemptsCount: Number(t.attemptsCount || 0),
      certificateThemeId: t.certificateThemeId ?? t.certificate_theme_id ?? null,
      resultsFinalised: Boolean(t.resultsFinalised ?? t.results_finalised),
      finalisedAt: t.finalisedAt ?? t.finalised_at ?? null,
      mockNumber: resolveMockNumberForTest(store, t),
      ...serializeAdminScheduleFields(t, nowMs),
    }));

    return res.status(200).json({
      ok: true,
      serverTimeMs: nowMs,
      hasActiveSignature: Boolean(activeSig),
      activeSignature: activeSig
        ? {
            id: activeSig.id,
            version: Number(activeSig.version),
            signatoryName: activeSig.signatory_name,
            signatoryTitle: activeSig.signatory_title,
            createdAt: Number(activeSig.created_at),
            previewDataUrl: activeSigDataUrl,
          }
        : null,
      certificates: list,
      mocks,
      themes: CERTIFICATE_THEME_LIST,
    });
  });

  // 12. POST /api/admin/certificates/:id/regenerate — Admin only: regenerate single certificate with current active signature & theme
  app.post('/api/admin/certificates/:id/regenerate', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    const store = loadD1Store() as any;
    ensureCertificateStoreArrays(store);
    const certId = decodeURIComponent(String(req.params.id || '')).trim();
    if (!hasAdminPermission(store, user, 'certificates.issue', { targetId: certId })) {
      return res.status(403).json({
        error: 'Permission denied: certificates.issue is required to regenerate certificates.',
        code: 'PERMISSION_DENIED',
        permission: 'certificates.issue',
      });
    }

    const { signatureRow: activeSig } = getActiveSignatureRecord(store);
    if (!activeSig) {
      return res.status(400).json({
        error: 'No active certificate signature found. Please upload or activate a signature first.',
        code: 'NO_ACTIVE_SIGNATURE',
      });
    }

    const cert = store.certificates.find((c: any) => c.id === certId || c.serial === certId);
    if (!cert) return res.status(404).json({ error: 'Certificate not found.', code: 'NOT_FOUND' });
    if (cert.status === 'revoked') {
      return res.status(400).json({
        error: 'Cannot regenerate a revoked certificate.',
        code: 'CERTIFICATE_REVOKED',
      });
    }

    cert.signature_version = Number(activeSig.version);

    const test = store.captainTests.find((t: any) => t.id === cert.grand_line_id);
    const preferredTheme =
      req.body?.themeId !== undefined
        ? req.body.themeId
        : test?.certificateThemeId ?? test?.certificate_theme_id ?? cert.theme_id;
    const resolvedTheme = resolveCertificateTheme(cert.grand_line_id, preferredTheme);
    cert.theme_id = preferredTheme && preferredTheme !== 'auto' ? preferredTheme : resolvedTheme.id;

    await renderAndPersistCertificateRow(store, cert);
    saveD1Store(store);

    return res.status(200).json({
      ok: true,
      certificate: {
        id: cert.id,
        serial: cert.serial,
        signatureVersion: cert.signature_version,
        themeId: cert.theme_id,
      },
    });
  });

  // 13. POST /api/admin/certificates/regenerate-all — Admin only: regenerate all active certificates needing the current active signature in small batches
  app.post('/api/admin/certificates/regenerate-all', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    const store = loadD1Store() as any;
    ensureCertificateStoreArrays(store);
    if (!hasAdminPermission(store, user, 'certificates.issue')) {
      return res.status(403).json({
        error: 'Permission denied: certificates.issue is required to regenerate certificates.',
        code: 'PERMISSION_DENIED',
        permission: 'certificates.issue',
      });
    }

    const { signatureRow: activeSig } = getActiveSignatureRecord(store);
    if (!activeSig) {
      return res.status(400).json({
        error: 'No active certificate signature found. Please upload or activate a signature first.',
        code: 'NO_ACTIVE_SIGNATURE',
      });
    }

    const activeVersion = Number(activeSig.version);
    const targetGrandLineId = req.body?.grandLineId ? String(req.body.grandLineId).trim() : '';
    const cursor = String(req.body?.cursor || req.query?.cursor || '').trim();
    const batchSize = Math.min(25, Math.max(1, Number(req.body?.limit || req.query?.limit || 10)));

    // Select all certificates WHERE status = 'active' AND signature_version != activeVersion
    const allMatching = [...store.certificates]
      .filter((c: any) => {
        if (c.status !== 'active') return false;
        if (Number(c.signature_version) === activeVersion) return false;
        if (targetGrandLineId && c.grand_line_id !== targetGrandLineId) return false;
        return true;
      })
      .sort((a: any, b: any) => String(a.id).localeCompare(String(b.id)));

    const totalPending = allMatching.length;
    if (totalPending === 0) {
      return res.status(200).json({
        ok: true,
        total: 0,
        regenerated: 0,
        regeneratedCount: 0,
        failed: 0,
        errors: [],
        signatureVersion: activeVersion,
        hasMore: false,
        nextCursor: null,
      });
    }

    const filteredAfterCursor = cursor
      ? allMatching.filter((c: any) => String(c.id).localeCompare(cursor) > 0)
      : allMatching;
    const batch = filteredAfterCursor.slice(0, batchSize);

    let regenerated = 0;
    let failed = 0;
    const errors: Array<{ id: string; serial: string; error: string }> = [];
    let lastId: string | null = null;

    for (const cert of batch) {
      lastId = cert.id;
      if (cert.status !== 'active') continue;
      try {
        // Keep serial and issued_at unchanged; overwrite existing pdf_r2_key and png_r2_key
        cert.signature_version = activeVersion;
        await renderAndPersistCertificateRow(store, cert);
        regenerated += 1;
      } catch (err: any) {
        failed += 1;
        errors.push({
          id: cert.id,
          serial: cert.serial,
          error: err?.message || 'Failed to regenerate certificate',
        });
      }
    }

    saveD1Store(store);
    const remainingAfter = Math.max(0, totalPending - regenerated - failed);
    const hasMore = remainingAfter > 0 && batch.length === batchSize;

    return res.status(200).json({
      ok: true,
      total: totalPending,
      regenerated,
      regeneratedCount: regenerated,
      failed,
      errors,
      signatureVersion: activeVersion,
      hasMore,
      nextCursor: hasMore ? lastId : null,
      remaining: remainingAfter,
    });
  });

  // 14. POST /api/admin/certificates/:id/revoke (and /status) — Admin only: revoke or restore a certificate
  const handleRevokeOrRestoreCertificate = async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    const store = loadD1Store() as any;
    ensureCertificateStoreArrays(store);
    const certId = decodeURIComponent(String(req.params.id || '')).trim();
    if (!hasAdminPermission(store, user, 'certificates.issue', { targetId: certId })) {
      return res.status(403).json({
        error: 'Permission denied: certificates.issue is required to revoke or restore certificates.',
        code: 'PERMISSION_DENIED',
        permission: 'certificates.issue',
      });
    }

    const cert = store.certificates.find((c: any) => c.id === certId || c.serial === certId);
    if (!cert) return res.status(404).json({ error: 'Certificate not found.', code: 'NOT_FOUND' });

    const requestedStatus = req.body?.status;
    if (requestedStatus === 'active' || requestedStatus === 'revoked') {
      cert.status = requestedStatus;
    } else {
      cert.status = cert.status === 'revoked' ? 'active' : 'revoked';
    }

    saveD1Store(store);
    return res.status(200).json({
      ok: true,
      id: cert.id,
      serial: cert.serial,
      status: cert.status,
    });
  };
  app.post('/api/admin/certificates/:id/revoke', handleRevokeOrRestoreCertificate);
  app.post('/api/admin/certificates/:id/status', handleRevokeOrRestoreCertificate);

  // ===========================================================================
  // DAILY STARTER LIMIT SERVER-SIDE ENGINE (PKT Asia/Karachi UTC+5 Day Boundary)
  // ===========================================================================
  const FREE_DAILY_STARTER_LIMIT = 10;

  function computeServerPKTDateKey(nowMs: number = Date.now()): string {
    const pktMs = Number(nowMs) + 5 * 3600 * 1000;
    const d = new Date(pktMs);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function ensureDailyUsageStoreArray(store: any) {
    if (!Array.isArray(store.daily_starter_usage)) {
      store.daily_starter_usage = [];
    }
  }

  function getOrCreateDailyUsageRow(store: any, uid: string, pktDate: string) {
    ensureDailyUsageStoreArray(store);
    let row = store.daily_starter_usage.find(
      (r: any) => r.uid === uid && r.pkt_date === pktDate
    );
    if (!row) {
      row = {
        uid,
        pkt_date: pktDate,
        tests_started: 0,
        practice_attempts: 0,
        questions_solved: 0,
        ai_tutor_tokens: 0,
        updated_at: Date.now(),
      };
      store.daily_starter_usage.push(row);
    }
    return row;
  }

  // GET /api/usage/daily — Read current user's daily starter usage for today (PKT)
  app.get('/api/usage/daily', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    const requestedUid = String(req.query.uid || '').trim();
    const uid = user?.uid || requestedUid;
    if (!uid) {
      return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    }
    if (user && requestedUid && requestedUid !== user.uid) {
      const storeCheck = loadD1Store() as any;
      const roleRow = resolveD1Role(storeCheck, user);
      if (!['admin', 'superadmin'].includes(roleRow.role)) {
        return res.status(403).json({ error: 'Forbidden: Cannot read another user usage.', code: 'FORBIDDEN' });
      }
    }

    const dateKey = computeServerPKTDateKey();
    const store = loadD1Store() as any;
    ensureDailyUsageStoreArray(store);
    const row = store.daily_starter_usage.find(
      (r: any) => r.uid === uid && r.pkt_date === dateKey
    );

    const testsStarted = Number(row?.tests_started ?? 0);
    const practiceAttempts = Number(row?.practice_attempts ?? testsStarted);
    const questionsSolved = Number(row?.questions_solved ?? 0);
    const aiTutorTokens = Number(row?.ai_tutor_tokens ?? 0);

    return res.status(200).json({
      ok: true,
      uid,
      dateKey,
      timezone: 'Asia/Karachi',
      testsStarted,
      practiceAttempts,
      questionsUsed: testsStarted,
      questionsSolved,
      aiTutorTokens,
      limit: FREE_DAILY_STARTER_LIMIT,
    });
  });

  // POST /api/usage/daily/start-test — Atomically verify and increment daily starter limit on the server
  app.post('/api/usage/daily/start-test', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    const body = req.body || {};
    const isHealthcheck = Boolean(body.healthcheck);
    const requestedUid = String(body.uid || '').trim();

    let effectiveUid = user?.uid || '';
    if (isHealthcheck && requestedUid.startsWith('hc_dummy_')) {
      effectiveUid = requestedUid;
    } else if (!effectiveUid && requestedUid) {
      effectiveUid = requestedUid;
    }

    if (!effectiveUid) {
      return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    }

    // Prevent a normal user from incrementing another user's counter
    if (!isHealthcheck && user && requestedUid && requestedUid !== user.uid) {
      return res.status(403).json({ error: 'UID mismatch.', code: 'FORBIDDEN' });
    }

    const dateKey = computeServerPKTDateKey();
    const store = loadD1Store() as any;
    ensureDailyUsageStoreArray(store);

    let isSuper = false;
    if (!isHealthcheck && user) {
      const roleRow = resolveD1Role(store, user);
      isSuper = roleRow.role === 'superadmin' || roleRow.role === 'admin';
    }
    const isUnlimited = Boolean(body.isUnlimited) || isSuper;
    const attemptId =
      typeof body.customAttemptId === 'string' && body.customAttemptId.trim()
        ? body.customAttemptId.trim()
        : `att_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const row = getOrCreateDailyUsageRow(store, effectiveUid, dateKey);
    const currentTestsStarted = Number(row.tests_started || 0);

    if (isUnlimited) {
      return res.status(200).json({
        ok: true,
        blocked: false,
        attemptId,
        uid: effectiveUid,
        dateKey,
        timezone: 'Asia/Karachi',
        testsStarted: currentTestsStarted,
        limit: FREE_DAILY_STARTER_LIMIT,
      });
    }

    if (currentTestsStarted >= FREE_DAILY_STARTER_LIMIT) {
      return res.status(429).json({
        ok: false,
        blocked: true,
        code: 'DAILY_TESTS_LIMIT_EXCEEDED',
        error: `Daily test limit reached (${currentTestsStarted}/${FREE_DAILY_STARTER_LIMIT} tests). Upgrade or join a Study Crew to practice unlimited.`,
        uid: effectiveUid,
        dateKey,
        timezone: 'Asia/Karachi',
        testsStarted: currentTestsStarted,
        limit: FREE_DAILY_STARTER_LIMIT,
      });
    }

    row.tests_started = currentTestsStarted + 1;
    row.practice_attempts = Math.max(Number(row.practice_attempts || 0) + 1, row.tests_started);
    row.updated_at = Date.now();
    if (!isHealthcheck) {
      saveD1Store(store);
    }

    return res.status(200).json({
      ok: true,
      blocked: false,
      attemptId,
      uid: effectiveUid,
      dateKey,
      timezone: 'Asia/Karachi',
      testsStarted: row.tests_started,
      limit: FREE_DAILY_STARTER_LIMIT,
    });
  });

  // POST /api/usage/daily/record — Server-side recording of completed practice stats / AI tutor tokens
  app.post('/api/usage/daily/record', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    const body = req.body || {};
    const effectiveUid = user?.uid || String(body.uid || '').trim();
    if (!effectiveUid) {
      return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    }
    if (user && body.uid && String(body.uid).trim() !== user.uid) {
      return res.status(403).json({ error: 'UID mismatch.', code: 'FORBIDDEN' });
    }

    const dateKey = computeServerPKTDateKey();
    const store = loadD1Store() as any;
    const row = getOrCreateDailyUsageRow(store, effectiveUid, dateKey);

    if (typeof body.practiceAttemptsDelta === 'number' && body.practiceAttemptsDelta > 0) {
      row.practice_attempts = Number(row.practice_attempts || 0) + Math.floor(body.practiceAttemptsDelta);
    }
    if (typeof body.questionsSolvedDelta === 'number' && body.questionsSolvedDelta > 0) {
      row.questions_solved = Number(row.questions_solved || 0) + Math.floor(body.questionsSolvedDelta);
    }
    if (typeof body.aiTutorTokensDelta === 'number' && body.aiTutorTokensDelta > 0) {
      row.ai_tutor_tokens = Number(row.ai_tutor_tokens || 0) + Math.floor(body.aiTutorTokensDelta);
    }
    row.updated_at = Date.now();
    saveD1Store(store);

    return res.status(200).json({
      ok: true,
      uid: effectiveUid,
      dateKey,
      timezone: 'Asia/Karachi',
      testsStarted: Number(row.tests_started || 0),
      practiceAttempts: Number(row.practice_attempts || 0),
      questionsSolved: Number(row.questions_solved || 0),
      aiTutorTokens: Number(row.ai_tutor_tokens || 0),
    });
  });

  // POST /api/usage/daily/cleanup-healthcheck — Remove ephemeral hc_dummy_* rows after verification
  app.post('/api/usage/daily/cleanup-healthcheck', async (req: Request, res: Response) => {
    const targetUid = String(req.body?.uid || '').trim();
    if (!targetUid || !targetUid.startsWith('hc_dummy_')) {
      return res.status(400).json({ error: 'Only hc_dummy_* test UIDs can be cleaned up.', code: 'INVALID_UID' });
    }
    const store = loadD1Store() as any;
    ensureDailyUsageStoreArray(store);
    const before = store.daily_starter_usage.length;
    store.daily_starter_usage = store.daily_starter_usage.filter((r: any) => r.uid !== targetUid);
    const removed = before - store.daily_starter_usage.length;
    return res.status(200).json({
      ok: true,
      uid: targetUid,
      removed,
      dateKey: computeServerPKTDateKey(),
    });
  });

  // ============================================================================
  // SERVER-AUTHORITATIVE PRO PLAN STATUS & PURCHASE GUARD (/api/pro/*)
  // Prevents users with an active Pro plan or pending manual payment from starting
  // another purchase via direct API calls, double-tapping, or multiple tabs.
  // ============================================================================
  const inFlightProLocks = new Set<string>();

  const ensureProPurchaseLocksArray = (store: any): Array<Record<string, any>> => {
    if (!Array.isArray(store.pro_purchase_locks)) {
      store.pro_purchase_locks = [];
    }
    return store.pro_purchase_locks;
  };

  const fetchFirestoreUserDocRest = async (
    uid: string,
    bearerHeader: string
  ): Promise<Record<string, any> | null> => {
    const dbIds = Array.from(new Set([FIRESTORE_DATABASE_ID, '(default)'].filter(Boolean)));
    for (const dbId of dbIds) {
      try {
        const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/${encodeURIComponent(
          dbId
        )}/documents/users/${encodeURIComponent(uid)}`;
        const resp = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: bearerHeader,
            Accept: 'application/json',
          },
        });
        if (resp.ok) {
          const docJson = await resp.json().catch(() => null);
          const parsed = parseFirestoreRestDoc(docJson);
          if (parsed?.data) return parsed.data;
        }
      } catch {
        // Continue to fallback database id
      }
    }
    return null;
  };

  const fetchUserPendingPaymentRequestsRest = async (
    uid: string,
    bearerHeader: string
  ): Promise<Array<Record<string, any>>> => {
    const allReqs = await fetchFirestoreCollectionRest('paymentRequests', bearerHeader, 300);
    return allReqs
      .filter((r) => r.data && String(r.data.userId || '') === uid)
      .map((r) => ({ id: r.id, ...r.data }));
  };

  const resolveServerProStatus = async (
    uid: string,
    email: string | undefined,
    bearerHeader: string
  ) => {
    const serverNowMs = Date.now();
    const { resolveUnifiedPlanStatus, parseExpiryMillis } = await import('../config/plans');
    const store = loadD1Store() as any;
    const locks = ensureProPurchaseLocksArray(store);
    const roleInfo = resolveD1Role(store, { uid, email });

    const [userDoc, userReqs] = await Promise.all([
      bearerHeader ? fetchFirestoreUserDocRest(uid, bearerHeader) : Promise.resolve(null),
      bearerHeader ? fetchUserPendingPaymentRequestsRest(uid, bearerHeader) : Promise.resolve([]),
    ]);

    // Check D1 lock table for recent atomic lock (protects against race conditions across tabs)
    const lockIdx = locks.findIndex((l) => l && l.uid === uid);
    const existingLock = lockIdx >= 0 ? locks[lockIdx] : null;

    let effectivePlan = userDoc?.plan ?? null;
    let effectiveIsPremium = userDoc?.isPremium ?? null;
    let effectiveProPlanId = userDoc?.proPlanId ?? null;
    let effectivePlanExpiresAt = userDoc?.planExpiresAt ?? null;
    let effectivePremiumExpiresAt = userDoc?.premiumExpiresAt ?? null;
    const mergedPendingReqs = [...userReqs];

    if (existingLock) {
      const lockExpiry = Number(existingLock.expires_at || 0);
      if (existingLock.state === 'active' && lockExpiry > serverNowMs) {
        const fsExp = parseExpiryMillis(effectivePlanExpiresAt ?? effectivePremiumExpiresAt);
        // Only apply the D1 active lock if Firestore hasn't been explicitly cleared by an admin
        if (userDoc === null || (fsExp !== null && fsExp > serverNowMs) || userDoc?.isPremium === true || userDoc?.plan === 'pro') {
          effectivePlan = 'pro';
          effectiveIsPremium = true;
          effectiveProPlanId = existingLock.plan_id || effectiveProPlanId;
          if (!fsExp || lockExpiry > fsExp) {
            effectivePremiumExpiresAt = lockExpiry;
            effectivePlanExpiresAt = new Date(lockExpiry).toISOString();
          }
        } else {
          locks.splice(lockIdx, 1);
          saveD1Store(store);
        }
      } else if (existingLock.state === 'pending') {
        const lockAgeMs = serverNowMs - Number(existingLock.updated_at || 0);
        // Check if Firestore already shows this request was approved or rejected
        const matchingReq = userReqs.find((r) => r.id === existingLock.pending_request_id);
        const matchingStatus = String(matchingReq?.status || '').toLowerCase();
        if (matchingStatus === 'rejected' || matchingStatus === 'approved') {
          locks.splice(lockIdx, 1);
          saveD1Store(store);
        } else if (
          !mergedPendingReqs.some((r) => String(r.status || '').toLowerCase() === 'pending') &&
          lockAgeMs < 15 * 60 * 1000
        ) {
          // Keep the atomic pending lock while Firestore write is in-flight
          mergedPendingReqs.push({
            id: existingLock.pending_request_id || `pending_${uid}`,
            userId: uid,
            plan: existingLock.plan_id || 'pro_monthly',
            planName: existingLock.plan_name || 'Boardly Pro, Monthly Pass',
            amount_pkr: existingLock.amount_pkr || 199,
            method: existingLock.method || 'jazzcash',
            TID: existingLock.tid || '',
            status: 'pending',
            createdAt: existingLock.started_at || existingLock.updated_at || serverNowMs,
          });
        } else if (lockAgeMs >= 15 * 60 * 1000 && !matchingReq) {
          locks.splice(lockIdx, 1);
          saveD1Store(store);
        }
      } else if (existingLock.state === 'active' && lockExpiry <= serverNowMs) {
        locks.splice(lockIdx, 1);
        saveD1Store(store);
      }
    }

    const unified = resolveUnifiedPlanStatus({
      uid,
      email: email || userDoc?.email || null,
      role: userDoc?.role || roleInfo.role || 'student',
      isGuest: uid.startsWith('guest_') || Boolean(userDoc?.isGuest),
      plan: effectivePlan,
      isPremium: effectiveIsPremium,
      proPlanId: effectiveProPlanId,
      planStartedAt: userDoc?.planStartedAt,
      updatedAt: userDoc?.updatedAt,
      planExpiresAt: effectivePlanExpiresAt,
      premiumExpiresAt: effectivePremiumExpiresAt,
      pendingRequests: mergedPendingReqs,
      nowMs: serverNowMs,
    });

    setCachedUserProStatusAndBadge(uid, {
      activePro: unified.state === 'active' || Boolean(unified.isPro),
      nowMs: serverNowMs,
    });

    return { serverNowMs, status: unified, store, locks };
  };

  app.get('/api/pro/status', async (req: Request, res: Response) => {
    const authHeader = String(req.headers.authorization || '').trim();
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user || !user.uid) {
      return res.status(401).json({
        ok: false,
        code: 'UNAUTHENTICATED',
        error: 'Authentication required to check plan status.',
      });
    }

    if (user.uid.startsWith('guest_')) {
      const serverNowMs = Date.now();
      const { resolveUnifiedPlanStatus } = await import('../config/plans');
      const status = resolveUnifiedPlanStatus({
        uid: user.uid,
        isGuest: true,
        nowMs: serverNowMs,
      });
      return res.status(200).json({ ok: true, serverNowMs, status });
    }

    const { serverNowMs, status } = await resolveServerProStatus(
      user.uid,
      user.email,
      authHeader
    );
    return res.status(200).json({
      ok: true,
      serverNowMs,
      status,
    });
  });

  const handleProPurchaseGuard = async (req: Request, res: Response) => {
    const authHeader = String(req.headers.authorization || '').trim();
    const user = await verifyFirebaseJwtZeroFirestore(req);
    const body = req.body || {};

    if (!user || !user.uid) {
      return res.status(401).json({
        ok: false,
        code: 'UNAUTHENTICATED',
        error: 'You must be signed in to purchase Boardly Pro.',
      });
    }

    const uid = user.uid;
    if (uid.startsWith('guest_') || body.isGuest === true) {
      return res.status(403).json({
        ok: false,
        code: 'GUEST_UPGRADE_FORBIDDEN',
        error: 'Guest accounts cannot purchase Boardly Pro. Please create a registered account to upgrade.',
      });
    }

    if (inFlightProLocks.has(uid)) {
      return res.status(409).json({
        ok: false,
        code: 'PURCHASE_IN_PROGRESS',
        error: 'A purchase or payment verification request is already in progress for your account. Please wait a moment.',
      });
    }

    inFlightProLocks.add(uid);
    try {
      const { serverNowMs, status, store, locks } = await resolveServerProStatus(
        uid,
        user.email,
        authHeader
      );

      if (status.state === 'active') {
        return res.status(409).json({
          ok: false,
          code: 'PRO_ALREADY_ACTIVE',
          state: 'active',
          serverNowMs,
          status,
          error:
            status.blockReason ||
            `You already have Boardly Pro (${status.planName}) active until ${status.expiryFormatted}. You can purchase again after your current plan expires.`,
        });
      }

      if (status.state === 'pending') {
        return res.status(409).json({
          ok: false,
          code: 'PAYMENT_PENDING_VERIFICATION',
          state: 'pending',
          serverNowMs,
          status,
          error:
            'Your payment is being verified. This usually takes up to 24 hours. You cannot start another purchase while a payment is awaiting verification.',
        });
      }

      // If client is submitting an actual payment request (with transactionId and not just commitLock), execute full server-side payment submission + coupon validation + TID duplicate check
      if (
        (req.path === '/api/pro/submit-payment' || req.originalUrl?.includes('/api/pro/submit-payment')) &&
        body.transactionId &&
        body.commitLock !== true
      ) {
        const { handleEconomyApiRequest } = await import('../../functions/api/economy/[[path]]');
        const webReq = new Request(`http://localhost:3000/api/pro/submit-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authHeader ? { Authorization: authHeader } : {}),
          },
          body: JSON.stringify(body),
        });
        const webRes = await handleEconomyApiRequest({
          request: webReq,
          env: {
            FIREBASE_SERVICE_ACCOUNT: process.env.FIREBASE_SERVICE_ACCOUNT,
            GOOGLE_SERVICE_ACCOUNT_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
            FIREBASE_PROJECT_ID,
            FIREBASE_DATABASE_ID: FIRESTORE_DATABASE_ID,
          },
        });
        const payload = (await webRes.json().catch(() => ({}))) as Record<string, any>;
        if (webRes.ok && payload.ok && payload.paymentRequest) {
          const pr = payload.paymentRequest;
          const lockRecord = {
            uid,
            state: 'pending',
            plan_id: String(pr.plan || 'pro_monthly'),
            plan_name: String(pr.planName || 'Boardly Pro, Monthly Pass'),
            amount_pkr: Number(pr.amount_pkr ?? pr.amount ?? 199),
            method: String(pr.method || 'jazzcash'),
            tid: String(pr.TID || pr.transactionId || ''),
            started_at: serverNowMs,
            expires_at: null,
            pending_request_id: String(pr.id || ''),
            updated_at: serverNowMs,
          };
          const existingIdx = locks.findIndex((l) => l && l.uid === uid);
          if (existingIdx >= 0) {
            locks[existingIdx] = lockRecord;
          } else {
            locks.push(lockRecord);
          }
          saveD1Store(store);
        }
        return res.status(webRes.status).json(payload);
      }

      // If client is committing a purchase or payment request, record the atomic lock in D1 store immediately
      if (body.commitLock === true) {
        const lockState = body.lockState === 'active' ? 'active' : 'pending';
        const durationDays = Number(body.durationDays || (body.planId === 'pro_annual' ? 365 : 30));
        const expiresAt =
          lockState === 'active'
            ? Number(body.expiresAtMs || serverNowMs + durationDays * 24 * 60 * 60 * 1000)
            : null;
        const lockRecord = {
          uid,
          state: lockState,
          plan_id: String(body.planId || 'pro_monthly'),
          plan_name: String(body.planName || 'Boardly Pro, Monthly Pass'),
          amount_pkr: Number(body.amountPkr || 199),
          method: String(body.method || 'koban'),
          tid: String(body.tid || ''),
          started_at: serverNowMs,
          expires_at: expiresAt,
          pending_request_id: body.pendingRequestId ? String(body.pendingRequestId) : null,
          updated_at: serverNowMs,
        };
        const existingIdx = locks.findIndex((l) => l && l.uid === uid);
        if (existingIdx >= 0) {
          locks[existingIdx] = lockRecord;
        } else {
          locks.push(lockRecord);
        }
        saveD1Store(store);
      }

      return res.status(200).json({
        ok: true,
        code: 'PURCHASE_ALLOWED',
        state: 'none',
        canStartPurchase: true,
        serverNowMs,
        status,
      });
    } finally {
      inFlightProLocks.delete(uid);
    }
  };

  const delegateToEconomyWorker = async (req: Request, res: Response) => {
    try {
      const authHeader = String(req.headers.authorization || '').trim();
      const { handleEconomyApiRequest } = await import('../../functions/api/economy/[[path]]');
      const { verifyFirebaseIdToken } = await import('../../functions/_utils/firestoreRestAdmin');
      const targetPath = req.path || req.originalUrl || '/api/coupons/validate';
      const fullUrl = targetPath.startsWith('http')
        ? targetPath
        : `http://localhost:3000${targetPath.startsWith('/') ? '' : '/'}${targetPath}`;
      const method = String(req.method || 'POST').toUpperCase();
      const webReq = new Request(fullUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {}),
          ...(req.headers['x-idempotency-key']
            ? { 'X-Idempotency-Key': String(req.headers['x-idempotency-key']) }
            : {}),
          ...(req.headers['x-guest-session']
            ? { 'X-Guest-Session': String(req.headers['x-guest-session']) }
            : {}),
          ...(req.headers.cookie ? { Cookie: String(req.headers.cookie) } : {}),
        },
        body:
          method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS'
            ? JSON.stringify(req.body || {})
            : undefined,
      });

      const webRes = await handleEconomyApiRequest({
        request: webReq,
        env: {
          FIREBASE_SERVICE_ACCOUNT: process.env.FIREBASE_SERVICE_ACCOUNT,
          GOOGLE_SERVICE_ACCOUNT_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
          FIREBASE_PROJECT_ID,
          FIREBASE_DATABASE_ID: FIRESTORE_DATABASE_ID,
        },
        tokenVerifierOverride: async (hdr) => {
          if (!hdr) return null;
          try {
            const verified = await verifyFirebaseIdToken(hdr, FIREBASE_PROJECT_ID);
            if (verified?.uid) return verified;
          } catch {
            // Fall through to zero-firestore JWT verifier
          }
          const fallback = await verifyFirebaseJwtZeroFirestore(req);
          if (fallback?.uid) {
            return {
              uid: fallback.uid,
              email: fallback.email,
              name: fallback.name,
            };
          }
          return null;
        },
      });
      const payload = (await webRes.json().catch(() => ({}))) as Record<string, any>;

      // If this call activated Pro immediately (via 100%-off coupon or Koban Pro purchase), record the active lock in D1 store
      if (webRes.ok && payload.ok && (payload.activatedPro || payload.newExpiryMs)) {
        const verified = await verifyFirebaseJwtZeroFirestore(req);
        if (verified?.uid && payload.newExpiryMs) {
          const store = loadD1Store() as any;
          const locks = ensureProPurchaseLocksArray(store);
          const lockRecord = {
            uid: verified.uid,
            state: 'active',
            plan_id: String(payload.planId || 'pro_annual'),
            plan_name: String(payload.planName || 'Boardly Pro, Annual Pass'),
            amount_pkr: 0,
            method: payload.activatedPro ? 'coupon' : 'kobans',
            tid: '',
            started_at: Date.now(),
            expires_at: Number(payload.newExpiryMs),
            pending_request_id: null,
            updated_at: Date.now(),
          };
          const existingIdx = locks.findIndex((l) => l && l.uid === verified.uid);
          if (existingIdx >= 0) {
            locks[existingIdx] = lockRecord;
          } else {
            locks.push(lockRecord);
          }
          saveD1Store(store);
        }
      }

      return res.status(webRes.status).json(payload);
    } catch (err: any) {
      return res.status(500).json({
        ok: false,
        error: err?.message || 'Economy server error',
      });
    }
  };

  app.post('/api/pro/purchase-guard', handleProPurchaseGuard);
  app.post('/api/pro/purchase', handleProPurchaseGuard);
  app.post('/api/pro/submit-payment', handleProPurchaseGuard);
  app.post('/api/pro/activate', handleProPurchaseGuard);

  app.post('/api/pro/purchase-kobans', delegateToEconomyWorker);
  app.get('/api/pro/purchase-kobans', delegateToEconomyWorker);
  app.post('/api/coupons/validate', delegateToEconomyWorker);
  app.post('/api/coupons/redeem', delegateToEconomyWorker);
  app.post('/api/pro/coupon/validate', delegateToEconomyWorker);
  app.post('/api/pro/coupon/redeem', delegateToEconomyWorker);
  app.post('/api/store/purchase', delegateToEconomyWorker);
  app.get('/api/store/purchase', delegateToEconomyWorker);
  app.post('/api/store/unlock', delegateToEconomyWorker);
  app.get('/api/store/unlock', delegateToEconomyWorker);
  app.post('/api/store/buy', delegateToEconomyWorker);
  app.get('/api/store/buy', delegateToEconomyWorker);
  app.post('/api/kobans/purchase', delegateToEconomyWorker);
  app.get('/api/kobans/purchase', delegateToEconomyWorker);
  const requireCouponsGrantAndDelegate = async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    const store = loadD1Store() as any;
    const consumeOnce = req.method !== 'GET';
    if (!hasAdminPermission(store, user, 'coupons.grant', { consumeOnce })) {
      return res.status(403).json({
        error: 'Permission denied: coupons.grant is required to manage coupons or grant Kobans.',
        code: 'PERMISSION_DENIED',
        permission: 'coupons.grant',
      });
    }
    return delegateToEconomyWorker(req, res);
  };

  app.get('/api/admin/coupons', requireCouponsGrantAndDelegate);
  app.post('/api/admin/coupons', requireCouponsGrantAndDelegate);
  app.patch('/api/admin/coupons', requireCouponsGrantAndDelegate);
  app.put('/api/admin/coupons', requireCouponsGrantAndDelegate);

  // ===========================================================================
  // ADMIN USER OVERRIDE PERSISTENCE (BUG 3 + PART 2 ROLE / PLAN / SUSPEND)
  // ===========================================================================
  app.post('/api/admin/users/:uid/override', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });

    const targetUid = decodeURIComponent(String(req.params.uid || '').trim());
    if (!targetUid) {
      return res.status(400).json({ error: 'Target user UID is required.', code: 'INVALID_UID' });
    }

    const store = loadD1Store() as any;
    if (!Array.isArray(store.userRoles)) store.userRoles = [];
    if (!Array.isArray(store.pro_purchase_locks)) store.pro_purchase_locks = [];

    const body = req.body || {};
    const nowMs = Date.now();
    const callerRoleRow = resolveD1Role(store, user);
    const callerIsSuperAdmin =
      callerRoleRow.role === 'super_admin' ||
      callerRoleRow.role === 'superadmin' ||
      SUPERADMIN_UIDS.has(user.uid);

    let roleRow = store.userRoles.find((r: any) => r.uid === targetUid);
    let d1UserRow: any = null;
    try {
      const localD1 = getSharedLocalD1Database();
      for (const u of localD1.tables.user_usernames.values()) {
        if (u.uid === targetUid) {
          d1UserRow = u;
          break;
        }
      }
    } catch {
      // ignore
    }

    const currentRole =
      roleRow?.role === 'superadmin'
        ? 'super_admin'
        : roleRow?.role || d1UserRow?.role || (SUPERADMIN_UIDS.has(targetUid) ? 'super_admin' : 'student');
    const currentPlan =
      (roleRow as any)?.plan || d1UserRow?.plan || 'free';
    const currentSuspended = Boolean(
      (roleRow as any)?.suspended || roleRow?.is_posting_banned || d1UserRow?.suspended
    );

    const requestedRole =
      body.role !== undefined
        ? body.role === 'superadmin'
          ? 'super_admin'
          : String(body.role).trim()
        : undefined;
    const requestedPlan =
      body.plan !== undefined ? (body.plan === 'pro' ? 'pro' : 'free') : undefined;
    const requestedSuspended =
      body.suspended !== undefined ? Boolean(body.suspended) : undefined;

    const changingRole = requestedRole !== undefined && requestedRole !== currentRole;
    const changingPlan =
      (requestedPlan !== undefined && requestedPlan !== currentPlan) ||
      body.planExpiresAt !== undefined ||
      body.extendMonths !== undefined;
    const changingSuspend =
      requestedSuspended !== undefined && requestedSuspended !== currentSuspended;

    if (changingRole) {
      if (!hasAdminPermission(store, user, 'users.role', { targetId: targetUid })) {
        return res.status(403).json({
          error: 'Permission denied: users.role is required to change user roles.',
          code: 'PERMISSION_DENIED',
          permission: 'users.role',
        });
      }
      if (requestedRole === 'super_admin' && !callerIsSuperAdmin) {
        return res.status(403).json({
          error: 'Only a Super Admin can assign the Super Admin role.',
          code: 'PERMISSION_DENIED',
          permission: 'users.role',
        });
      }
      if (currentRole === 'super_admin' && requestedRole !== 'super_admin') {
        if (SUPERADMIN_UIDS.has(targetUid)) {
          return res.status(403).json({
            error: 'Cannot demote a protected Super Admin owner account.',
            code: 'LAST_SUPERADMIN_PROTECTED',
          });
        }
        const otherSuperAdmins = (store.userRoles || []).filter(
          (r: any) =>
            r.uid !== targetUid &&
            (r.role === 'super_admin' || r.role === 'superadmin' || SUPERADMIN_UIDS.has(r.uid))
        );
        if (otherSuperAdmins.length === 0) {
          return res.status(403).json({
            error: 'Cannot demote the last remaining Super Admin.',
            code: 'LAST_SUPERADMIN_PROTECTED',
          });
        }
      }
    }

    if (changingPlan) {
      if (!hasAdminPermission(store, user, 'users.plan', { targetId: targetUid })) {
        return res.status(403).json({
          error: 'Permission denied: users.plan is required to change subscription plans.',
          code: 'PERMISSION_DENIED',
          permission: 'users.plan',
        });
      }
    }

    if (changingSuspend) {
      if (!hasAdminPermission(store, user, 'users.suspend', { targetId: targetUid })) {
        return res.status(403).json({
          error: 'Permission denied: users.suspend is required to suspend or unsuspend users.',
          code: 'PERMISSION_DENIED',
          permission: 'users.suspend',
        });
      }
      if (requestedSuspended && (currentRole === 'super_admin' || SUPERADMIN_UIDS.has(targetUid))) {
        return res.status(403).json({
          error: 'Cannot suspend a Super Admin account.',
          code: 'LAST_SUPERADMIN_PROTECTED',
        });
      }
    }

    const finalRole = requestedRole ?? currentRole;
    const finalPlan: 'free' | 'pro' = requestedPlan ?? (currentPlan === 'pro' ? 'pro' : 'free');
    const finalSuspended = requestedSuspended ?? currentSuspended;

    let finalExpiresIso: string | null = null;
    if (finalPlan === 'pro') {
      if (typeof body.planExpiresAt === 'string' && body.planExpiresAt.trim()) {
        finalExpiresIso = body.planExpiresAt.trim();
      } else {
        const extendMonths = Number(body.extendMonths || 0);
        const daysToAdd = extendMonths > 0 ? extendMonths * 30 : 30;
        finalExpiresIso = new Date(nowMs + daysToAdd * 86400 * 1000).toISOString();
      }
    } else {
      finalExpiresIso = null;
    }

    if (!roleRow) {
      roleRow = {
        uid: targetUid,
        email: String(body.email || d1UserRow?.email || '').trim().toLowerCase(),
        role: finalRole,
        custom_role:
          finalRole === 'super_admin'
            ? 'Super Admin'
            : finalRole === 'admin'
            ? 'Admin'
            : finalRole === 'captain'
            ? 'Nakama Captain'
            : finalRole === 'crew'
            ? 'Nakama Crew'
            : null,
        is_posting_banned: finalSuspended ? 1 : 0,
        updated_at: nowMs,
      };
      store.userRoles.push(roleRow);
    } else {
      roleRow.role = finalRole;
      roleRow.is_posting_banned = finalSuspended ? 1 : 0;
      roleRow.updated_at = nowMs;
      if (body.email && !roleRow.email) {
        roleRow.email = String(body.email).trim().toLowerCase();
      }
    }
    (roleRow as any).plan = finalPlan;
    (roleRow as any).is_premium = finalPlan === 'pro';
    (roleRow as any).plan_expires_at = finalExpiresIso;
    (roleRow as any).suspended = finalSuspended;

    // Also update pro_purchase_locks so resolveUnifiedPlanStatus reflects the new plan immediately
    store.pro_purchase_locks = (store.pro_purchase_locks || []).filter(
      (l: any) => l.uid !== targetUid
    );
    if (finalPlan === 'pro' && finalExpiresIso) {
      const expiresMs = new Date(finalExpiresIso).getTime();
      if (Number.isFinite(expiresMs) && expiresMs > nowMs) {
        store.pro_purchase_locks.push({
          uid: targetUid,
          email: roleRow.email || '',
          order_id: `admin_override_${nowMs}`,
          purchased_at: nowMs,
          expires_at: expiresMs,
          status: 'active',
        });
      }
    }

    // Also persist to shared local D1 user_usernames table
    try {
      const localD1 = getSharedLocalD1Database();
      for (const u of localD1.tables.user_usernames.values()) {
        if (u.uid === targetUid) {
          u.role = finalRole;
          u.plan = finalPlan;
          u.is_premium = finalPlan === 'pro' ? 1 : 0;
          u.plan_expires_at = finalExpiresIso;
          u.suspended = finalSuspended ? 1 : 0;
          u.updated_at = nowMs;
        }
      }
    } catch {
      // ignore
    }

    saveD1Store(store);

    return res.status(200).json({
      ok: true,
      user: {
        uid: targetUid,
        email: roleRow.email || d1UserRow?.email || '',
        displayName: d1UserRow?.username_display || d1UserRow?.display_name || body.displayName || 'Student',
        role: finalRole,
        plan: finalPlan,
        isPremium: finalPlan === 'pro',
        planExpiresAt: finalExpiresIso,
        suspended: finalSuspended,
        updatedAt: nowMs,
      },
    });
  });

  // ===========================================================================
  // ACCESS REQUESTS & TEMPORARY PERMISSION GRANTS (/api/admin/access-requests*)
  // ===========================================================================
  const VALID_PERMISSION_KEYS = new Set([
    'mcq.manage',
    'content.delete',
    'users.view',
    'users.suspend',
    'users.delete',
    'users.role',
    'users.plan',
    'coupons.grant',
    'tests.manage',
    'tests.end',
    'certificates.issue',
    'announcements.manage',
    'security.reset',
    'audit.view',
  ]);

  function expireStaleAccessGrants(store: any, nowMs: number) {
    if (!Array.isArray(store.accessGrants)) store.accessGrants = [];
    if (!Array.isArray(store.accessRequests)) store.accessRequests = [];
    return store.accessGrants.filter((g: any) => {
      if (g.revokedAt || g.usedAt) return false;
      if (g.expiresAt !== null && g.expiresAt !== undefined && Number(g.expiresAt) <= nowMs) {
        return false;
      }
      return true;
    });
  }

  // POST /api/admin/access-requests — Limited Admin creates a pending access request
  app.post('/api/admin/access-requests', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });

    const store = loadD1Store() as any;
    const roleRow = resolveD1Role(store, user);
    if (!['admin', 'super_admin', 'superadmin'].includes(roleRow.role)) {
      return res.status(403).json({
        error: 'Only Admin accounts can request elevated permissions.',
        code: 'FORBIDDEN',
      });
    }

    if (!checkWriteRateLimit(`access_req:${user.uid}`, 15, 60 * 1000)) {
      return res.status(429).json({
        error: 'Too many access requests. Please wait a minute before trying again.',
        code: 'RATE_LIMITED',
      });
    }

    const body = req.body || {};
    const permission = String(body.permission || '').trim();
    const reason = String(body.reason || '').trim().slice(0, 500);
    const targetType = body.targetType ? String(body.targetType).trim().slice(0, 60) : null;
    const targetId = body.targetId ? String(body.targetId).trim().slice(0, 120) : null;
    const targetLabel = body.targetLabel ? String(body.targetLabel).trim().slice(0, 200) : null;

    if (!VALID_PERMISSION_KEYS.has(permission)) {
      return res.status(400).json({
        error: `Invalid permission key: ${permission}`,
        code: 'INVALID_PERMISSION',
      });
    }
    if (!reason || reason.length < 3) {
      return res.status(400).json({
        error: 'A clear reason (at least 3 characters) is required.',
        code: 'REASON_REQUIRED',
      });
    }

    if (!Array.isArray(store.accessRequests)) store.accessRequests = [];

    // Block duplicate pending requests for the same admin + permission + targetId
    const existingPending = store.accessRequests.find(
      (r: any) =>
        r.adminUid === user.uid &&
        r.permission === permission &&
        (r.targetId || null) === (targetId || null) &&
        r.status === 'pending'
    );
    if (existingPending) {
      return res.status(409).json({
        ok: false,
        code: 'DUPLICATE_PENDING_REQUEST',
        error: 'You already have a pending request for this action.',
        request: existingPending,
      });
    }

    const nowMs = Date.now();
    const newReq = {
      id: `areq_${nowMs}_${crypto.randomUUID().slice(0, 8)}`,
      adminUid: user.uid,
      adminName: user.displayName || user.name || (user.email ? user.email.split('@')[0] : 'Admin'),
      adminEmail: user.email || '',
      permission,
      targetType,
      targetId,
      targetLabel,
      reason,
      status: 'pending',
      createdAt: nowMs,
      decidedAt: null,
      decidedBy: null,
      decisionNote: null,
      grantDuration: null,
      expiresAt: null,
    };

    store.accessRequests.unshift(newReq);
    saveD1Store(store);

    return res.status(201).json({
      ok: true,
      request: newReq,
    });
  });

  // GET /api/admin/access-requests/mine — Admin fetches own active grants & requests
  app.get('/api/admin/access-requests/mine', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });

    const store = loadD1Store() as any;
    const roleRow = resolveD1Role(store, user);
    if (!['admin', 'super_admin', 'superadmin'].includes(roleRow.role)) {
      return res.status(403).json({ error: 'Forbidden', code: 'FORBIDDEN' });
    }

    const nowMs = Date.now();
    const activeGrants = expireStaleAccessGrants(store, nowMs).filter(
      (g: any) => g.adminUid === user.uid
    );
    const myRequests = (store.accessRequests || []).filter(
      (r: any) => r.adminUid === user.uid
    );

    return res.status(200).json({
      ok: true,
      grants: activeGrants,
      requests: myRequests,
    });
  });

  // GET /api/admin/access-requests — Super Admin lists requests & active grants
  app.get('/api/admin/access-requests', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });

    const store = loadD1Store() as any;
    const roleRow = resolveD1Role(store, user);
    const isSuperAdmin =
      roleRow.role === 'super_admin' ||
      roleRow.role === 'superadmin' ||
      SUPERADMIN_UIDS.has(user.uid);
    if (!isSuperAdmin) {
      return res.status(403).json({
        error: 'Forbidden: Only Super Admin can view all access requests.',
        code: 'PERMISSION_DENIED',
        permission: 'users.role',
      });
    }

    const statusFilter = String(req.query.status || '').trim().toLowerCase();
    const nowMs = Date.now();
    const allRequests = Array.isArray(store.accessRequests) ? store.accessRequests : [];
    const filteredRequests =
      statusFilter && statusFilter !== 'all'
        ? allRequests.filter((r: any) => String(r.status || '').toLowerCase() === statusFilter)
        : allRequests;
    const activeGrants = expireStaleAccessGrants(store, nowMs);

    return res.status(200).json({
      ok: true,
      requests: filteredRequests,
      grants: activeGrants,
      pendingCount: allRequests.filter((r: any) => r.status === 'pending').length,
      migrationReport: store.roleMigrationV1 || null,
    });
  });

  // POST /api/admin/access-requests/:id/approve — Super Admin approves a request
  app.post('/api/admin/access-requests/:id/approve', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });

    const store = loadD1Store() as any;
    const roleRow = resolveD1Role(store, user);
    const isSuperAdmin =
      roleRow.role === 'super_admin' ||
      roleRow.role === 'superadmin' ||
      SUPERADMIN_UIDS.has(user.uid);
    if (!isSuperAdmin) {
      return res.status(403).json({
        error: 'Forbidden: Only Super Admin can approve access requests.',
        code: 'PERMISSION_DENIED',
        permission: 'users.role',
      });
    }

    const reqId = decodeURIComponent(String(req.params.id || '').trim());
    if (!Array.isArray(store.accessRequests)) store.accessRequests = [];
    if (!Array.isArray(store.accessGrants)) store.accessGrants = [];

    const reqRow = store.accessRequests.find((r: any) => r.id === reqId);
    if (!reqRow) {
      return res.status(404).json({ error: 'Access request not found.', code: 'NOT_FOUND' });
    }

    if (reqRow.adminUid === user.uid) {
      return res.status(403).json({
        error: 'An admin can never approve their own access request.',
        code: 'SELF_APPROVAL_FORBIDDEN',
      });
    }

    const rawDuration = String(req.body?.duration || '1h').trim();
    const duration: 'once' | '1h' | '24h' | '7d' = ['once', '1h', '24h', '7d'].includes(rawDuration)
      ? (rawDuration as 'once' | '1h' | '24h' | '7d')
      : '1h';
    const note = req.body?.note ? String(req.body.note).trim().slice(0, 500) : null;

    const nowMs = Date.now();
    const durationMsMap: Record<string, number | null> = {
      once: nowMs + 24 * 3600 * 1000, // 24h window to use single-use grant
      '1h': nowMs + 3600 * 1000,
      '24h': nowMs + 24 * 3600 * 1000,
      '7d': nowMs + 7 * 24 * 3600 * 1000,
    };
    const expiresAt = durationMsMap[duration];

    reqRow.status = 'approved';
    reqRow.decidedAt = nowMs;
    reqRow.decidedBy = user.uid;
    reqRow.decisionNote = note;
    reqRow.grantDuration = duration;
    reqRow.expiresAt = expiresAt;

    const grant = {
      id: `agrant_${nowMs}_${crypto.randomUUID().slice(0, 8)}`,
      requestId: reqRow.id,
      adminUid: reqRow.adminUid,
      adminName: reqRow.adminName,
      adminEmail: reqRow.adminEmail,
      permission: reqRow.permission,
      targetType: reqRow.targetType || null,
      targetId: reqRow.targetId || null,
      targetLabel: reqRow.targetLabel || null,
      duration,
      grantedBy: user.uid,
      grantedAt: nowMs,
      expiresAt,
      usedAt: null,
      revokedAt: null,
    };
    store.accessGrants.unshift(grant);
    saveD1Store(store);

    return res.status(200).json({
      ok: true,
      request: reqRow,
      grant,
    });
  });

  // POST /api/admin/access-requests/:id/deny — Super Admin denies a request
  app.post('/api/admin/access-requests/:id/deny', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });

    const store = loadD1Store() as any;
    const roleRow = resolveD1Role(store, user);
    const isSuperAdmin =
      roleRow.role === 'super_admin' ||
      roleRow.role === 'superadmin' ||
      SUPERADMIN_UIDS.has(user.uid);
    if (!isSuperAdmin) {
      return res.status(403).json({
        error: 'Forbidden: Only Super Admin can deny access requests.',
        code: 'PERMISSION_DENIED',
        permission: 'users.role',
      });
    }

    const reqId = decodeURIComponent(String(req.params.id || '').trim());
    if (!Array.isArray(store.accessRequests)) store.accessRequests = [];
    const reqRow = store.accessRequests.find((r: any) => r.id === reqId);
    if (!reqRow) {
      return res.status(404).json({ error: 'Access request not found.', code: 'NOT_FOUND' });
    }

    const nowMs = Date.now();
    const note = req.body?.note ? String(req.body.note).trim().slice(0, 500) : null;
    reqRow.status = 'denied';
    reqRow.decidedAt = nowMs;
    reqRow.decidedBy = user.uid;
    reqRow.decisionNote = note;

    saveD1Store(store);
    return res.status(200).json({
      ok: true,
      request: reqRow,
    });
  });

  // POST /api/admin/access-grants/:id/revoke — Super Admin revokes an active grant immediately
  app.post('/api/admin/access-grants/:id/revoke', async (req: Request, res: Response) => {
    const user = await verifyFirebaseJwtZeroFirestore(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });

    const store = loadD1Store() as any;
    const roleRow = resolveD1Role(store, user);
    const isSuperAdmin =
      roleRow.role === 'super_admin' ||
      roleRow.role === 'superadmin' ||
      SUPERADMIN_UIDS.has(user.uid);
    if (!isSuperAdmin) {
      return res.status(403).json({
        error: 'Forbidden: Only Super Admin can revoke access grants.',
        code: 'PERMISSION_DENIED',
        permission: 'users.role',
      });
    }

    const grantId = decodeURIComponent(String(req.params.id || '').trim());
    if (!Array.isArray(store.accessGrants)) store.accessGrants = [];
    const grant = store.accessGrants.find((g: any) => g.id === grantId);
    if (!grant) {
      return res.status(404).json({ error: 'Access grant not found.', code: 'NOT_FOUND' });
    }

    const nowMs = Date.now();
    grant.revokedAt = nowMs;
    const linkedReq = (store.accessRequests || []).find((r: any) => r.id === grant.requestId);
    if (linkedReq) {
      linkedReq.status = 'revoked';
    }
    saveD1Store(store);

    return res.status(200).json({
      ok: true,
      grant,
    });
  });

  const delegateToAuthWorker = async (req: Request, res: Response) => {
    try {
      const { handleAuthApiRequest } = await import('../../functions/api/auth/[[path]]');
      const authHeader = String(req.headers.authorization || '').trim();
      const targetPath = req.originalUrl || req.url || req.path || '/api/auth/resolve-profiles';
      const fullUrl = targetPath.startsWith('http')
        ? targetPath
        : `http://localhost:3000${targetPath.startsWith('/') ? '' : '/'}${targetPath}`;
      const method = String(req.method || 'GET').toUpperCase();
      const webReq = new Request(fullUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {}),
          ...(req.headers['x-guest-session']
            ? { 'X-Guest-Session': String(req.headers['x-guest-session']) }
            : {}),
          ...(req.headers['x-device-id']
            ? { 'X-Device-Id': String(req.headers['x-device-id']) }
            : {}),
          ...(req.headers.cookie ? { Cookie: String(req.headers.cookie) } : {}),
        },
        body:
          method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS'
            ? JSON.stringify(req.body || {})
            : undefined,
      });
      const webRes = await handleAuthApiRequest({
        request: webReq,
        env: {
          DB: getSharedLocalD1Database(),
          FIREBASE_SERVICE_ACCOUNT: process.env.FIREBASE_SERVICE_ACCOUNT,
          GOOGLE_SERVICE_ACCOUNT_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
          FIREBASE_PROJECT_ID,
          FIREBASE_DATABASE_ID: FIRESTORE_DATABASE_ID,
        },
      });
      const payload = (await webRes.json().catch(() => ({}))) as Record<string, any>;
      return res.status(webRes.status).json(payload);
    } catch (err: any) {
      return res.status(500).json({
        ok: false,
        error: err?.message || 'Auth worker error',
      });
    }
  };

  app.post('/api/auth/profile-sync', delegateToAuthWorker);
  app.post('/api/auth/profile-layout', delegateToAuthWorker);
  app.put('/api/auth/profile-layout', delegateToAuthWorker);
  app.get('/api/auth/profile-layout', delegateToAuthWorker);
  app.get('/api/auth/resolve-profiles', delegateToAuthWorker);
  app.post('/api/auth/username-register', delegateToAuthWorker);
  app.get('/api/auth/username-check', delegateToAuthWorker);
  app.get('/api/auth/username-suggest', delegateToAuthWorker);
}

const AUTHENTICATED_APP_ROUTE_PREFIXES = [
  '/dashboard',
  '/admin',
  '/store',
  '/rewards',
  '/wallet',
  '/checkout',
  '/settings',
  '/saved',
  '/notifications',
  '/messages',
  '/results',
  '/practice',
  '/test',
  '/onboarding',
  '/verify-email',
  '/profile/edit',
  '/arena/register',
  '/arena/test',
];

export function isAuthenticatedAppRoute(pathname: string): boolean {
  const clean = (pathname || '/').split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
  return AUTHENTICATED_APP_ROUTE_PREFIXES.some(
    (prefix) => clean === prefix || clean.startsWith(`${prefix}/`)
  );
}

function escapeHtmlAttr(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function resolveServerRouteMeta(pathname: string) {
  const rawPath = (pathname || '/').split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
  const cleanPath = rawPath.toLowerCase() === '/index.html' ? '/' : rawPath;
  const isApiOrAuthRoute =
    cleanPath === '/api' ||
    cleanPath.startsWith('/api/') ||
    isAuthenticatedAppRoute(cleanPath);
  const rawBase = resolveStaticOrPatternRouteMeta(cleanPath);
  const baseMeta: {
    title: string;
    description: string;
    canonical: string;
    ogType: 'website' | 'article' | 'profile';
    ogImage: string;
    robots: string;
    h1: string;
    statusCode: number;
    jsonLd?: string;
    rootBodyHtml?: string;
  } = {
    ...rawBase,
    canonical: rawBase.canonicalUrl || `https://boardly.cfd${cleanPath === '/' ? '' : cleanPath}`,
    robots: rawBase.noindex
      ? 'noindex, nofollow'
      : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    h1: rawBase.title.split('—')[0].split('|')[0].trim() || rawBase.title,
    statusCode: isApiOrAuthRoute ? 200 : cleanPath === '/410' ? 410 : 200,
  };

  if (isApiOrAuthRoute) {
    return baseMeta;
  }

  if (
    cleanPath.startsWith('/commons/post/') ||
    cleanPath.startsWith('/material/') ||
    cleanPath.startsWith('/study-material/')
  ) {
    if (
      cleanPath.startsWith('/material/subject/') ||
      cleanPath.startsWith('/study-material/subject/')
    ) {
      return baseMeta;
    }
    const slugParam = decodeURIComponent(
      cleanPath
        .replace(/^\/commons\/post\//, '')
        .replace(/^\/study-material\//, '')
        .replace(/^\/material\//, '')
        .replace(/\/+$/, '')
    );
    const lookupId = extractIdFromSlugOrId(slugParam);
    const store = loadD1Store();
    const d1Row = store.posts.find(
      (p) => p.id === lookupId || p.id === slugParam || p.slug === slugParam
    );

    const isMissingOrPrivate =
      !d1Row ||
      Boolean(d1Row.is_hidden) ||
      Boolean((d1Row as any).deleted) ||
      Boolean((d1Row as any).is_deleted) ||
      d1Row.status === 'removed' ||
      d1Row.status === 'deleted' ||
      d1Row.status === 'private' ||
      d1Row.status === 'members_only' ||
      d1Row.status === 'anonymous_restricted' ||
      (d1Row.visibility && d1Row.visibility !== 'public');

    if (isMissingOrPrivate) {
      const notFoundHtml = `<main style="max-width:720px;margin:48px auto;padding:24px;color:#f4f4f5;font-family:system-ui,-apple-system,sans-serif;">
  <h1 style="font-size:28px;font-weight:800;margin-bottom:12px;">Post Not Found (404)</h1>
  <p style="color:#a1a1aa;line-height:1.6;">This Commons post does not exist or has been removed.</p>
  <p style="margin-top:16px;"><a href="https://boardly.cfd/commons" style="color:#e11d2e;text-decoration:underline;">Browse Boardly Commons</a></p>
</main>`;
      return {
        ...baseMeta,
        title: 'Post Not Found — Boardly Commons',
        description: 'This Commons post does not exist or has been removed.',
        robots: 'noindex, nofollow',
        h1: 'Post Not Found',
        statusCode: 404,
        rootBodyHtml: notFoundHtml,
      };
    }

    const isMaterial =
      cleanPath.startsWith('/material/') || cleanPath.startsWith('/study-material/');
    const canonicalSlug = buildSlug(d1Row.id, d1Row.title);
    const canonicalUrl = isMaterial
      ? `https://boardly.cfd/material/${canonicalSlug}`
      : `https://boardly.cfd/commons/post/${canonicalSlug}`;

    const title = isMaterial
      ? `${d1Row.title} — ${d1Row.subject || 'Study Material'} PDF & Notes | Boardly`
      : `${d1Row.title} | Boardly Commons`;

    const maskSensitiveText = (txt: string) =>
      String(txt || '')
        .replace(
          /https?:\/\/(?:chat\.whatsapp\.com|wa\.me|api\.whatsapp\.com)\/[^\s)]+/gi,
          '[WhatsApp link hidden for student privacy]'
        )
        .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email hidden]')
        .replace(/(?:\+92|0092|0)[\s.-]?3\d{2}[\s.-]?\d{7}\b/g, '[phone hidden]');

    const safeAuthorDisplayName = (rawName: string | undefined | null, isAnon: number | boolean) => {
      if (isAnon) return 'Anonymous Student';
      const cleaned = String(rawName || '').trim();
      if (!cleaned) return 'Boardly Student';
      if (cleaned.includes('@')) {
        const prefix = cleaned.split('@')[0]?.trim() || '';
        return prefix.length >= 2 && !prefix.includes('.')
          ? prefix.charAt(0).toUpperCase() + prefix.slice(1)
          : 'Boardly Student';
      }
      return cleaned;
    };

    const maskedBodyText = maskSensitiveText(d1Row.description || '');
    const rawDesc = maskedBodyText.replace(/\s+/g, ' ').trim();
    const authorLabel = safeAuthorDisplayName(d1Row.author_name, d1Row.is_anonymous);

    // First ~155 characters of the post for meta description
    const description = rawDesc
      ? rawDesc.length > 158
        ? `${rawDesc.slice(0, 155).trimEnd()}...`
        : rawDesc
      : `Read "${d1Row.title}" by ${authorLabel} in ${d1Row.subject || 'Boardly Commons'} on Boardly.`;

    let postOgImage = baseMeta.ogImage;
    try {
      const parsedFiles = JSON.parse(d1Row.files_json || '[]');
      if (Array.isArray(parsedFiles)) {
        const firstImg = parsedFiles.find(
          (f: any) =>
            f?.url &&
            (String(f.type || '').startsWith('image/') ||
              /\.(png|jpe?g|webp|gif)$/i.test(String(f.name || f.url || '')))
        );
        if (firstImg?.url) {
          postOgImage = String(firstImg.url).startsWith('http')
            ? String(firstImg.url)
            : `https://boardly.cfd${String(firstImg.url).startsWith('/') ? '' : '/'}${String(firstImg.url)}`;
        }
      }
    } catch {
      // keep fallback brand ogImage
    }

    const createdMs = Number(d1Row.created_at || Date.now());
    const updatedMs = Number(d1Row.updated_at || createdMs);
    const publishedIso = new Date(createdMs).toISOString();
    const modifiedIso = new Date(updatedMs).toISOString();
    const formattedDate = new Date(createdMs).toUTCString();

    const topComments = (store.comments || [])
      .filter((c) => c.post_id === d1Row.id)
      .sort((a, b) => Number(a.created_at || 0) - Number(b.created_at || 0))
      .slice(0, 10);

    const commentCount = Math.max(Number(d1Row.comment_count || 0), topComments.length);

    // Compute related public posts at render time (read-only)
    const targetSubj = String(d1Row.subject || '').toLowerCase().trim();
    const relatedPosts = store.posts
      .filter(
        (p) =>
          p.id !== d1Row.id &&
          !p.is_hidden &&
          !(p as any).deleted &&
          !(p as any).is_deleted &&
          p.status !== 'removed' &&
          p.status !== 'deleted' &&
          (!p.visibility || p.visibility === 'public')
      )
      .sort((a, b) => {
        const aMatch = String(a.subject || '').toLowerCase().trim() === targetSubj ? 1 : 0;
        const bMatch = String(b.subject || '').toLowerCase().trim() === targetSubj ? 1 : 0;
        if (aMatch !== bMatch) return bMatch - aMatch;
        return Number(b.created_at || 0) - Number(a.created_at || 0);
      })
      .slice(0, 4);

    const jsonLdObj = {
      '@context': 'https://schema.org',
      '@type': 'DiscussionForumPosting',
      '@id': canonicalUrl,
      url: canonicalUrl,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': canonicalUrl,
      },
      headline: d1Row.title,
      text: maskedBodyText || d1Row.title,
      articleSection: d1Row.subject || 'General',
      datePublished: publishedIso,
      dateModified: modifiedIso,
      author: {
        '@type': 'Person',
        name: authorLabel,
      },
      publisher: {
        '@type': 'Organization',
        name: 'Boardly',
        url: 'https://boardly.cfd',
      },
      interactionStatistic: [
        {
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/LikeAction',
          userInteractionCount: Number(d1Row.upvotes || 0),
        },
        {
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/CommentAction',
          userInteractionCount: commentCount,
        },
      ],
      commentCount,
      comment: topComments.map((c) => ({
        '@type': 'Comment',
        text: maskSensitiveText(String(c.text || '')),
        dateCreated: new Date(Number(c.created_at || createdMs)).toISOString(),
        author: {
          '@type': 'Person',
          name: safeAuthorDisplayName(c.author_name, c.is_anonymous),
        },
      })),
    };

    const jsonLd = JSON.stringify(jsonLdObj).replace(/</g, '\\u003c');

    const commentsHtml =
      topComments.length > 0
        ? `<section aria-label="Comments" style="margin-top:28px;border-top:1px solid rgba(255,255,255,0.1);padding-top:20px;">
      <h2 style="font-size:18px;font-weight:700;margin-bottom:12px;">Comments (${commentCount})</h2>
      ${topComments
        .map((c) => {
          const cAuthor = safeAuthorDisplayName(c.author_name, c.is_anonymous);
          const cDate = new Date(Number(c.created_at || createdMs)).toISOString();
          return `<div itemprop="comment" itemscope itemtype="https://schema.org/Comment" style="margin-bottom:14px;padding:12px;border-radius:10px;background:rgba(255,255,255,0.03);">
        <div style="font-size:13px;color:#a1a1aa;margin-bottom:4px;">
          <strong itemprop="author">${escapeHtmlAttr(cAuthor)}</strong> • <time itemprop="dateCreated" datetime="${escapeHtmlAttr(cDate)}">${escapeHtmlAttr(cDate.slice(0, 10))}</time>
        </div>
        <div itemprop="text" style="font-size:14px;line-height:1.5;color:#e4e4e7;">${escapeHtmlAttr(maskSensitiveText(String(c.text || '')))}</div>
      </div>`;
        })
        .join('\n')}
    </section>`
        : `<section aria-label="Comments" style="margin-top:28px;border-top:1px solid rgba(255,255,255,0.1);padding-top:20px;">
      <h2 style="font-size:18px;font-weight:700;margin-bottom:8px;">Comments (${commentCount})</h2>
      <p style="font-size:14px;color:#a1a1aa;">Sign in on Boardly Commons to join the discussion.</p>
    </section>`;

    const relatedHtml =
      relatedPosts.length > 0
        ? `<section aria-label="Related posts" style="margin-top:28px;border-top:1px solid rgba(255,255,255,0.1);padding-top:20px;">
      <h2 style="font-size:18px;font-weight:700;margin-bottom:12px;">Related Posts in ${escapeHtmlAttr(d1Row.subject || 'Boardly Commons')}</h2>
      <ul style="list-style:none;padding:0;margin:0;display:grid;gap:10px;">
        ${relatedPosts
          .map((rp) => {
            const rpSlug = buildSlug(rp.id, rp.title);
            return `<li><a href="https://boardly.cfd/commons/post/${escapeHtmlAttr(rpSlug)}" style="color:#e11d2e;text-decoration:underline;font-weight:600;">${escapeHtmlAttr(rp.title)}</a> <span style="font-size:12px;color:#a1a1aa;">(${escapeHtmlAttr(rp.subject || 'Commons')})</span></li>`;
          })
          .join('\n        ')}
      </ul>
    </section>`
        : '';

    const rootBodyHtml = `<main style="max-width:820px;margin:0 auto;padding:32px 20px;color:#f4f4f5;font-family:system-ui,-apple-system,sans-serif;">
  <nav aria-label="Breadcrumb" style="font-size:13px;color:#a1a1aa;margin-bottom:16px;">
    <a href="https://boardly.cfd/" style="color:#a1a1aa;text-decoration:underline;">Home</a> &gt;
    <a href="https://boardly.cfd/commons" style="color:#a1a1aa;text-decoration:underline;">Commons</a> &gt;
    <span aria-current="page" style="color:#ffffff;">${escapeHtmlAttr(d1Row.title)}</span>
  </nav>
  <article itemscope itemtype="https://schema.org/DiscussionForumPosting">
    <header style="margin-bottom:20px;">
      <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#e11d2e;margin-bottom:8px;">
        ${escapeHtmlAttr(d1Row.subject || 'General')} • Class ${escapeHtmlAttr(d1Row.class_level || '11/12')} • ${escapeHtmlAttr(d1Row.board || 'Federal')} Board • ${commentCount} ${commentCount === 1 ? 'comment' : 'comments'}
      </div>
      <h1 itemprop="headline" style="font-size:28px;font-weight:800;line-height:1.3;margin:0 0 12px;color:#ffffff;">${escapeHtmlAttr(d1Row.title)}</h1>
      <div style="font-size:13px;color:#a1a1aa;">
        Posted by <span itemprop="author" itemscope itemtype="https://schema.org/Person"><span itemprop="name">${escapeHtmlAttr(authorLabel)}</span></span>
        on <time itemprop="datePublished" datetime="${escapeHtmlAttr(publishedIso)}">${escapeHtmlAttr(formattedDate)}</time>
      </div>
    </header>
    <div itemprop="text" style="font-size:16px;line-height:1.75;color:#e4e4e7;white-space:pre-wrap;">${escapeHtmlAttr(maskedBodyText || d1Row.title)}</div>
    ${commentsHtml}
    ${relatedHtml}
  </article>
</main>`;

    return {
      ...baseMeta,
      title,
      description,
      canonical: canonicalUrl,
      ogType: 'article' as const,
      ogImage: postOgImage,
      h1: d1Row.title,
      statusCode: 200,
      jsonLd,
      rootBodyHtml,
    };
  }

  return baseMeta;
}

export function injectRouteMetaIntoHtml(
  html: string,
  pathname: string,
  options?: { isCrawler?: boolean }
): string {
  const clean = (pathname || '/').split('?')[0].split('#')[0];
  if (clean.toLowerCase() === '/index.html') {
    return html;
  }

  const meta = resolveServerRouteMeta(clean);
  const t = escapeHtmlAttr(meta.title);
  const d = escapeHtmlAttr(meta.description);
  const c = escapeHtmlAttr(meta.canonical);
  const img = escapeHtmlAttr(meta.ogImage);

  let out = html
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${t}</title>`)
    .replace(
      /<meta\s+name="title"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="title" content="${t}" />`
    )
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="description" content="${d}" />`
    )
    .replace(
      /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="robots" content="${escapeHtmlAttr(meta.robots)}" />`
    )
    .replace(
      /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
      `<link rel="canonical" href="${c}" />`
    )
    .replace(
      /<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:type" content="${meta.ogType}" />`
    )
    .replace(
      /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:url" content="${c}" />`
    )
    .replace(
      /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:title" content="${t}" />`
    )
    .replace(
      /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:description" content="${d}" />`
    )
    .replace(
      /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:image" content="${img}" />`
    )
    .replace(
      /<meta\s+name="twitter:url"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:url" content="${c}" />`
    )
    .replace(
      /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:title" content="${t}" />`
    )
    .replace(
      /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:description" content="${d}" />`
    )
    .replace(
      /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:image" content="${img}" />`
    );

  if (meta.jsonLd && !out.includes('id="boardly-post-jsonld"')) {
    out = out.replace(
      /<\/head>/i,
      `  <script id="boardly-post-jsonld" type="application/ld+json">${meta.jsonLd}</script>\n</head>`
    );
  }

  // Only replace <div id="root"> when explicitly serving a crawler user-agent
  if (options?.isCrawler && meta.rootBodyHtml) {
    if (/<div\s+id="root"\s*>[\s\S]*?<\/div>\s*(?=<script\b|<\/body>)/i.test(out)) {
      out = out.replace(
        /<div\s+id="root"\s*>[\s\S]*?<\/div>\s*(?=<script\b|<\/body>)/i,
        `<div id="root">${meta.rootBodyHtml}</div>\n    `
      );
    } else {
      out = out.replace(
        /<div\s+id="root"\s*><\/div>/i,
        `<div id="root">${meta.rootBodyHtml}</div>`
      );
    }
  }

  return out;
}

/**
 * Creates a universal Node HTTP / Connect / Express middleware that serves all
 * Cloudflare D1 + R2 `/api/posts*`, `/api/r2/*`, `/sitemap.xml`, `/api/auth/*`,
 * `/api/admin/users/delete`, and pre-rendered SEO HTML for crawlers.
 */
export function createCloudflarePostsAndAuthMiddleware(options?: {
  getGoogleAccessToken?: () => Promise<string | null>;
}) {
  interface RouteDef {
    method: string;
    pattern: string;
    regex: RegExp;
    paramNames: string[];
    handler: (req: any, res: any) => any;
  }

  const routes: RouteDef[] = [];

  const compilePattern = (pattern: string): { regex: RegExp; paramNames: string[] } => {
    const paramNames: string[] = [];
    if (pattern === '/api/r2/*') {
      paramNames.push('0');
      return { regex: /^\/api\/r2\/(.*)$/, paramNames };
    }
    if (pattern === '/api/signatures/*') {
      paramNames.push('0');
      return { regex: /^\/api\/signatures\/(.*)$/, paramNames };
    }
    const escaped = pattern
      .replace(/\/+$/, '')
      .replace(/\./g, '\\.')
      .replace(/:([a-zA-Z0-9_]+)/g, (_m, name) => {
        paramNames.push(name);
        return '([^/.]+)';
      });
    return { regex: new RegExp(`^${escaped || '/'}/?$`), paramNames };
  };

  const addRoute = (method: string, pattern: string, handler: (req: any, res: any) => any) => {
    const { regex, paramNames } = compilePattern(pattern);
    routes.push({ method: method.toUpperCase(), pattern, regex, paramNames, handler });
  };

  const fakeApp = {
    get: (p: string, h: any) => addRoute('GET', p, h),
    post: (p: string, h: any) => addRoute('POST', p, h),
    put: (p: string, h: any) => addRoute('PUT', p, h),
    patch: (p: string, h: any) => addRoute('PATCH', p, h),
    delete: (p: string, h: any) => addRoute('DELETE', p, h),
  } as unknown as Express;

  registerCloudflarePostsAndAuthRoutes(fakeApp, options || {});

  return async function cloudflareMiddleware(req: any, res: any, next: () => void) {
    const fullUrl = req.originalUrl || req.url || '/';
    const parsedUrl = new URL(fullUrl, 'http://localhost');
    const pathname = parsedUrl.pathname;
    const isApiRoute = pathname === '/api' || pathname.startsWith('/api/');
    const isAuthRoute = isAuthenticatedAppRoute(pathname);

    // 1. Public GET/HEAD SEO redirects, trailing-slash rule, and crawler pre-rendered HTML
    //    Strictly excludes every /api/* path, every mutating request, and all authenticated app routes.
    if (
      (req.method === 'GET' || req.method === 'HEAD') &&
      !isApiRoute &&
      !isAuthRoute &&
      !pathname.startsWith('/assets/') &&
      !pathname.startsWith('/src/') &&
      !pathname.startsWith('/@') &&
      pathname !== '/sw.js' &&
      pathname !== '/manifest.json' &&
      pathname !== '/site.webmanifest' &&
      !/\.(js|mjs|css|png|jpg|jpeg|webp|gif|svg|ico|xml|txt|json|webmanifest|woff2?|ttf|otf|mp4|webm|map|pdf)$/i.test(
        pathname
      )
    ) {
      const cleanPublicPath = pathname.replace(/\/+$/, '') || '/';
      const searchSuffix = parsedUrl.search || '';
      const hostHeader = String(req.headers?.host || '').toLowerCase();

      // 301 redirect www.boardly.cfd -> https://boardly.cfd
      if (hostHeader === 'www.boardly.cfd') {
        res.writeHead(301, { Location: `https://boardly.cfd${cleanPublicPath}${searchSuffix}` });
        res.end();
        return;
      }

      if (cleanPublicPath === '/about-kobans') {
        res.writeHead(301, { Location: `/kobans${searchSuffix}` });
        res.end();
        return;
      }
      if (cleanPublicPath === '/study-material') {
        res.writeHead(301, { Location: `/material${searchSuffix}` });
        res.end();
        return;
      }
      if (pathname.length > 1 && pathname.endsWith('/')) {
        res.writeHead(301, { Location: `${cleanPublicPath}${searchSuffix}` });
        res.end();
        return;
      }

      // 301 redirect ID-only /commons/post/{id} to canonical /commons/post/{id}-{slug}
      if (cleanPublicPath.startsWith('/commons/post/')) {
        try {
          const slugParam = decodeURIComponent(cleanPublicPath.slice('/commons/post/'.length));
          const store = loadD1Store();
          const exactIdRow = store.posts.find(
            (p) =>
              p.id === slugParam &&
              !p.is_hidden &&
              !(p as any).deleted &&
              !(p as any).is_deleted &&
              p.status !== 'removed' &&
              p.status !== 'deleted' &&
              (!p.visibility || p.visibility === 'public')
          );
          if (exactIdRow) {
            const canonicalSlug = buildSlug(exactIdRow.id, exactIdRow.title);
            if (canonicalSlug && canonicalSlug !== slugParam) {
              res.writeHead(301, { Location: `/commons/post/${canonicalSlug}${searchSuffix}` });
              res.end();
              return;
            }
          }
        } catch {
          // ignore redirect lookup errors and continue to SPA
        }
      }

      const ua = String(req.headers?.['user-agent'] || '').toLowerCase();
      const isBot =
        /facebookexternalhit|whatsapp|twitterbot|telegrambot|discordbot|linkedinbot|slackbot|googlebot|bingbot|yandex|duckduckbot|applebot|baiduspider|pinterest|embedly|redditbot|chrome-lighthouse/i.test(
          ua
        ) ||
        parsedUrl.searchParams.get('crawler') === '1' ||
        parsedUrl.searchParams.get('crawler') === 'true';

      const isPublicSeoPage =
        cleanPublicPath.startsWith('/commons/post/') ||
        cleanPublicPath === '/commons' ||
        cleanPublicPath.startsWith('/commons/subject/') ||
        cleanPublicPath.startsWith('/material') ||
        cleanPublicPath.startsWith('/mcqs') ||
        cleanPublicPath.startsWith('/subjects') ||
        cleanPublicPath.startsWith('/grand-line') ||
        cleanPublicPath === '/' ||
        cleanPublicPath === '/pricing' ||
        cleanPublicPath === '/about' ||
        cleanPublicPath === '/features' ||
        cleanPublicPath === '/how-it-works' ||
        cleanPublicPath === '/faq';

      if (isBot && isPublicSeoPage) {
        try {
          const meta = resolveServerRouteMeta(pathname);
          const jsonLdTag = meta.jsonLd
            ? `\n  <script id="boardly-post-jsonld" type="application/ld+json">${meta.jsonLd}</script>`
            : '';
          const bodyContent =
            meta.rootBodyHtml ||
            `<main>\n    <h1>${escapeHtmlAttr(meta.h1)}</h1>\n    <p>${escapeHtmlAttr(meta.description)}</p>\n  </main>`;
          const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtmlAttr(meta.title)}</title>
  <meta name="description" content="${escapeHtmlAttr(meta.description)}" />
  <meta name="robots" content="${escapeHtmlAttr(meta.robots)}" />
  <link rel="canonical" href="${escapeHtmlAttr(meta.canonical)}" />
  <meta property="og:type" content="${meta.ogType}" />
  <meta property="og:site_name" content="Boardly" />
  <meta property="og:title" content="${escapeHtmlAttr(meta.title)}" />
  <meta property="og:description" content="${escapeHtmlAttr(meta.description)}" />
  <meta property="og:url" content="${escapeHtmlAttr(meta.canonical)}" />
  <meta property="og:image" content="${escapeHtmlAttr(meta.ogImage)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${escapeHtmlAttr(meta.canonical)}" />
  <meta name="twitter:title" content="${escapeHtmlAttr(meta.title)}" />
  <meta name="twitter:description" content="${escapeHtmlAttr(meta.description)}" />
  <meta name="twitter:image" content="${escapeHtmlAttr(meta.ogImage)}" />${jsonLdTag}
</head>
<body>
  <div id="root">${bodyContent}</div>
</body>
</html>`;
          res.statusCode = meta.statusCode || 200;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Vary', 'User-Agent');
          res.end(html);
          return;
        } catch {
          // On any error in crawler rendering, fall back to normal SPA index.html
        }
      }
    }

    // 2. Match registered API / sitemap / R2 routes
    const method = String(req.method || 'GET').toUpperCase();
    if (
      method === 'OPTIONS' &&
      (pathname.startsWith('/api/posts') ||
        pathname.startsWith('/api/questions') ||
        pathname.startsWith('/api/universities') ||
        pathname.startsWith('/api/mcqs') ||
        pathname.startsWith('/api/admin') ||
        pathname.startsWith('/api/r2') ||
        pathname.startsWith('/api/auth') ||
        pathname.startsWith('/api/pro') ||
        pathname.startsWith('/api/store') ||
        pathname.startsWith('/api/coupons') ||
        pathname.startsWith('/api/kobans') ||
        pathname.startsWith('/api/rewards') ||
        pathname.startsWith('/api/payments') ||
        pathname.startsWith('/api/checkout') ||
        pathname.startsWith('/api/bots') ||
        pathname.startsWith('/api/certificates') ||
        pathname.startsWith('/api/verify') ||
        pathname.startsWith('/api/tests') ||
        pathname.startsWith('/api/usage') ||
        pathname.startsWith('/api/signatures') ||
        pathname.startsWith('/api/announcements'))
    ) {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers':
          'Content-Type, Authorization, X-Idempotency-Key, X-Bot-Run-Secret, X-Guest-Session, X-Device-Id',
      });
      res.end();
      return;
    }

    let matchedRoute: RouteDef | null = null;
    let matchResult: RegExpExecArray | null = null;

    for (const r of routes) {
      if (r.method !== method) continue;
      const m = r.regex.exec(pathname);
      if (m) {
        matchedRoute = r;
        matchResult = m;
        break;
      }
    }

    if (!matchedRoute || !matchResult) {
      return next();
    }

    // Populate Express-compatible req & res helpers if not present
    req.originalUrl = fullUrl;
    req.path = pathname;
    req.ip =
      req.ip ||
      String(req.headers?.['x-forwarded-for'] || '').split(',')[0].trim() ||
      req.socket?.remoteAddress ||
      'local';

    const queryObj: Record<string, string> = {};
    parsedUrl.searchParams.forEach((v, k) => {
      queryObj[k] = v;
    });
    req.query = req.query || queryObj;

    const paramsObj: Record<string, string> = {};
    matchedRoute.paramNames.forEach((name, idx) => {
      paramsObj[name] = decodeURIComponent(matchResult![idx + 1] || '');
    });
    req.params = paramsObj;

    if (typeof res.status !== 'function') {
      res.status = (code: number) => {
        res.statusCode = code;
        return res;
      };
    }
    if (typeof res.json !== 'function') {
      res.json = (obj: unknown) => {
        if (!res.headersSent) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
        }
        res.end(JSON.stringify(obj));
        return res;
      };
    }
    if (typeof res.send !== 'function') {
      res.send = (body: unknown) => {
        if (typeof body === 'object' && body !== null && !Buffer.isBuffer(body)) {
          return res.json(body);
        }
        res.end(body);
        return res;
      };
    }
    if (typeof res.sendFile !== 'function') {
      res.sendFile = (filePath: string) => {
        const stat = fs.statSync(filePath);
        res.setHeader('Content-Length', stat.size);
        fs.createReadStream(filePath).pipe(res);
        return res;
      };
    }
    if (typeof res.redirect !== 'function') {
      res.redirect = (statusOrUrl: number | string, maybeUrl?: string) => {
        const code = typeof statusOrUrl === 'number' ? statusOrUrl : 302;
        const target = typeof statusOrUrl === 'string' ? statusOrUrl : maybeUrl || '/';
        res.writeHead(code, { Location: target });
        res.end();
        return res;
      };
    }

    // Parse JSON body if needed
    if ((method === 'POST' || method === 'PUT' || method === 'PATCH') && req.body === undefined) {
      await new Promise<void>((resolve) => {
        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
        req.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          try {
            req.body = raw ? JSON.parse(raw) : {};
          } catch {
            req.body = {};
          }
          resolve();
        });
        req.on('error', () => {
          req.body = {};
          resolve();
        });
      });
    }

    try {
      await matchedRoute.handler(req, res);
    } catch (err: any) {
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: err?.message || 'Internal server error' });
      }
    }
  };
}


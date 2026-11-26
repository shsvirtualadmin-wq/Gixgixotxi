import type { CaptainApplication, CrewApplication } from '@/types';

export type NormalizedApplicationStatus = 'pending' | 'approved' | 'rejected';

/**
 * Single source of truth for application status normalization across:
 * - /admin Overview ("Pending applications" card)
 * - /admin/applications (filter chips, status badges, and Approve/Reject action visibility)
 *
 * Student application forms historically write mixed casing (e.g. CaptainApplyPage writes
 * `status: 'Pending'` while CrewApplyPage writes `status: 'pending'`), and older records
 * may use `'PENDING'`, `'submitted'`, `'under_review'`, or omit `status`.
 */
export function normalizeApplicationStatus(rawStatus: unknown): NormalizedApplicationStatus {
  const normalized = String(rawStatus ?? '')
    .trim()
    .toLowerCase();

  if (normalized === 'approved' || normalized === 'accepted' || normalized === 'active') {
    return 'approved';
  }
  if (normalized === 'rejected' || normalized === 'declined' || normalized === 'denied') {
    return 'rejected';
  }
  return 'pending';
}

export function isPendingApplicationStatus(rawStatus: unknown): boolean {
  return normalizeApplicationStatus(rawStatus) === 'pending';
}

function pickCleanString(...candidates: unknown[]): string {
  for (const val of candidates) {
    if (typeof val !== 'string') continue;
    const trimmed = val.trim();
    if (!trimmed) continue;
    const lower = trimmed.toLowerCase();
    if (lower === 'undefined' || lower === 'null') continue;
    return trimmed;
  }
  return '';
}

export function extractTimestampMs(ts: unknown): number {
  if (!ts) return 0;
  if (typeof ts === 'number' && Number.isFinite(ts)) return ts;
  if (typeof ts === 'string') {
    const parsed = Date.parse(ts);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (typeof ts === 'object') {
    const obj = ts as {
      toMillis?: () => number;
      toDate?: () => Date;
      seconds?: number;
      _seconds?: number;
    };
    if (typeof obj.toMillis === 'function') {
      try {
        return obj.toMillis();
      } catch {
        return 0;
      }
    }
    if (typeof obj.toDate === 'function') {
      try {
        return obj.toDate().getTime();
      } catch {
        return 0;
      }
    }
    if (typeof obj.seconds === 'number') return obj.seconds * 1000;
    if (typeof obj._seconds === 'number') return obj._seconds * 1000;
  }
  return 0;
}

export function normalizeCaptainApplicationDoc(
  id: string,
  raw: Record<string, unknown>
): CaptainApplication {
  const email = pickCleanString(raw.email);
  const emailPrefix = email ? email.split('@')[0] : '';
  const userId = pickCleanString(raw.userId, raw.uid, id);
  const name =
    pickCleanString(
      raw.name,
      raw.studentName,
      raw.fullName,
      raw.displayName,
      raw.userName,
      emailPrefix
    ) || 'Applicant';

  return {
    ...(raw as Partial<CaptainApplication>),
    id,
    userId,
    name,
    email,
    phone: pickCleanString(raw.phone, raw.whatsapp),
    university: pickCleanString(raw.university, raw.institution, raw.college),
    city: pickCleanString(raw.city),
    semester: pickCleanString(raw.semester, raw.grade, raw.academicLevel) || undefined,
    socialLink: pickCleanString(raw.socialLink, raw.instagram) || undefined,
    motivation: pickCleanString(raw.motivation, raw.statement, raw.promotionPlan, raw.answers),
    expectedReach: pickCleanString(raw.expectedReach) || undefined,
    status: normalizeApplicationStatus(raw.status),
    createdAt: (raw.createdAt || raw.appliedAt || raw.submittedAt) as CaptainApplication['createdAt'],
    approvedAt: (raw.approvedAt || raw.reviewedAt) as CaptainApplication['approvedAt'],
    approvedBy: pickCleanString(raw.approvedBy, raw.reviewedBy) || undefined,
    rejectionReason: pickCleanString(raw.rejectionReason, raw.adminNote) || undefined,
  };
}

export function normalizeCrewApplicationDoc(
  id: string,
  raw: Record<string, unknown>
): CrewApplication {
  const email = pickCleanString(raw.email);
  const emailPrefix = email ? email.split('@')[0] : '';
  const userId = pickCleanString(raw.userId, raw.uid, id);
  const name =
    pickCleanString(
      raw.name,
      raw.fullName,
      raw.studentName,
      raw.displayName,
      raw.userName,
      emailPrefix
    ) || 'Applicant';

  return {
    ...(raw as Partial<CrewApplication>),
    id,
    userId,
    name,
    email,
    phone: pickCleanString(raw.phone, raw.whatsapp),
    college: pickCleanString(raw.college, raw.institution, raw.university),
    city: pickCleanString(raw.city),
    instagram: pickCleanString(raw.instagram) || undefined,
    whatsapp: pickCleanString(raw.whatsapp) || undefined,
    whyCrew: pickCleanString(raw.whyCrew, raw.promotionPlan, raw.statement, raw.motivation, raw.answers),
    status: normalizeApplicationStatus(raw.status),
    createdAt: (raw.createdAt || raw.submittedAt || raw.appliedAt) as CrewApplication['createdAt'],
    approvedAt: (raw.approvedAt || raw.reviewedAt) as CrewApplication['approvedAt'],
    approvedBy: pickCleanString(raw.approvedBy, raw.reviewedBy) || undefined,
    rejectionReason: pickCleanString(raw.rejectionReason, raw.adminNote) || undefined,
  };
}

export function filterApplicationsByStatus<T extends { status?: unknown }>(
  apps: T[],
  statusFilter: string
): T[] {
  const normalizedFilter = String(statusFilter || 'all')
    .trim()
    .toLowerCase();
  if (!normalizedFilter || normalizedFilter === 'all') {
    return apps;
  }
  const target = normalizeApplicationStatus(normalizedFilter);
  return apps.filter((app) => normalizeApplicationStatus(app.status) === target);
}

export function countPendingApplications(apps: Array<{ status?: unknown }>): number {
  return apps.reduce((sum, app) => sum + (isPendingApplicationStatus(app.status) ? 1 : 0), 0);
}

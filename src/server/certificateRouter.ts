import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { Certificate, CertificateSignatureRecord, VerifyCertificateResult } from '../types/certificate';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const CERTIFICATES_FILE = path.join(DATA_DIR, 'certificates.json');
const SIGNATURES_FILE = path.join(DATA_DIR, 'certificate_signatures.json');
const R2_BUCKET_DIR = path.join(DATA_DIR, 'r2-bucket');
const SIGNATURES_R2_DIR = path.join(R2_BUCKET_DIR, 'signatures');

// Ensure directories exist
function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(SIGNATURES_R2_DIR)) {
    fs.mkdirSync(SIGNATURES_R2_DIR, { recursive: true });
  }
}

export function loadCertificates(): Certificate[] {
  ensureDirs();
  if (!fs.existsSync(CERTIFICATES_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(CERTIFICATES_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[Certificates] Failed to parse certificates.json:', err);
    return [];
  }
}

export function saveCertificates(certs: Certificate[]): void {
  ensureDirs();
  fs.writeFileSync(CERTIFICATES_FILE, JSON.stringify(certs, null, 2), 'utf-8');
}

export function loadSignatures(): CertificateSignatureRecord[] {
  ensureDirs();
  if (!fs.existsSync(SIGNATURES_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(SIGNATURES_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[Signatures] Failed to parse certificate_signatures.json:', err);
    return [];
  }
}

export function saveSignatures(signatures: CertificateSignatureRecord[]): void {
  ensureDirs();
  fs.writeFileSync(SIGNATURES_FILE, JSON.stringify(signatures, null, 2), 'utf-8');
}

export function getActiveSignature(): CertificateSignatureRecord | null {
  const all = loadSignatures();
  return all.find((s) => s.active) || null;
}

/**
 * Loads mock test by id from data/ or D1 store
 */
export function loadMockTest(testId: string): any | null {
  const filesToTry = [
    path.join(DATA_DIR, 'captain_tests.json'),
    path.join(DATA_DIR, 'tests.json'),
    path.join(DATA_DIR, 'events.json'),
  ];
  for (const f of filesToTry) {
    if (fs.existsSync(f)) {
      try {
        const raw = JSON.parse(fs.readFileSync(f, 'utf-8'));
        const list = Array.isArray(raw) ? raw : (raw.tests || raw.items || []);
        const found = list.find((t: any) => String(t.id) === String(testId));
        if (found) return found;
      } catch (_err) {
        // Ignore unreadable or corrupt JSON files
      }
    }
  }
  return null;
}

/**
 * Loads test attempts for mock test
 */
export function loadAttemptsForMock(testId: string): any[] {
  const filesToTry = [
    path.join(DATA_DIR, 'test_attempts.json'),
    path.join(DATA_DIR, 'test_results.json'),
  ];
  const results: any[] = [];
  for (const f of filesToTry) {
    if (fs.existsSync(f)) {
      try {
        const raw = JSON.parse(fs.readFileSync(f, 'utf-8'));
        const list = Array.isArray(raw) ? raw : (raw.attempts || raw.results || []);
        for (const item of list) {
          if (String(item.testId || item.test_id || item.grand_line_id) === String(testId)) {
            results.push(item);
          }
        }
      } catch (_err) {
        // Ignore unreadable or corrupt JSON files
      }
    }
  }
  return results;
}

/**
 * Auto-generates short code from mock ID (never from its name)
 */
export function generateMockCode(testId: string): string {
  const clean = String(testId || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (clean.length >= 4) {
    return clean.slice(0, 4);
  }
  return (clean + 'MOCK').slice(0, 4);
}

/**
 * Generates next serial in format: BDLY-<mock_code>-<4 digit sequence>
 */
export function generateCertificateSerial(mockCode: string, sequenceNum: number): string {
  const seqStr = String(sequenceNum).padStart(4, '0');
  return `BDLY-${mockCode.toUpperCase()}-${seqStr}`;
}

/**
 * Stores signature buffer into private R2 storage
 */
export function saveSignatureToR2(version: number, dataUrl: string): string {
  ensureDirs();
  const key = `signatures/sig_${version}_${Date.now()}.png`;
  const fullPath = path.join(R2_BUCKET_DIR, key);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  fs.writeFileSync(fullPath, Buffer.from(base64Data, 'base64'));
  return key;
}

/**
 * Finalizes results for a mock test, discovers 1st position student(s) (including ties!),
 * creates certificates idempotently, and dispatches awards.
 */
export async function finalizeAndIssueCertificates(
  testId: string,
  callerUid?: string
): Promise<{ certificates: Certificate[]; count: number }> {
  const certs = loadCertificates();
  const activeSig = getActiveSignature();

  // Load mock test record
  let mock = loadMockTest(testId);
  if (!mock) {
    // Check if test attempts have the mock title
    const atts = loadAttemptsForMock(testId);
    const firstAtt = atts[0];
    mock = {
      id: testId,
      title: firstAtt?.testTitle || firstAtt?.test_title || 'Grand Line Mock',
      mock_code: generateMockCode(testId),
      certificate_theme_id: 'auto',
    };
  }

  // Exact mock name: character for character (no prefix, no transformation)
  const exactMockName = String(mock.title || mock.name || 'Grand Line Mock');
  const mockCode = String(mock.mock_code || generateMockCode(testId));
  const themeId = String(mock.certificate_theme_id || 'auto');

  // Load and rank attempts
  const attempts = loadAttemptsForMock(testId);
  if (attempts.length === 0) {
    return { certificates: [], count: 0 };
  }

  // Sort by score DESC, then timeTakenSeconds ASC, then createdAt ASC
  const sorted = [...attempts].sort((a, b) => {
    const scoreA = Number(a.score ?? 0);
    const scoreB = Number(b.score ?? 0);
    if (scoreB !== scoreA) return scoreB - scoreA;

    const timeA = Number(a.timeTakenSeconds ?? a.time_taken_seconds ?? 999999);
    const timeB = Number(b.timeTakenSeconds ?? b.time_taken_seconds ?? 999999);
    if (timeA !== timeB) return timeA - timeB;

    const dateA = new Date(a.createdAt ?? a.created_at ?? 0).getTime();
    const dateB = new Date(b.createdAt ?? b.created_at ?? 0).getTime();
    return dateA - dateB;
  });

  const topScore = Number(sorted[0].score ?? 0);
  const participantsCount = sorted.length;

  // Identify all students tied for 1st position
  const firstPositionAttempts = sorted.filter(
    (att) => Number(att.score ?? 0) === topScore
  );

  const newCertificates: Certificate[] = [];
  const now = new Date().toISOString();

  // Sequence counter for this mock's serials
  const existingForMock = certs.filter((c) => c.grand_line_id === testId);
  let nextSeq = existingForMock.length + 1;

  for (const att of firstPositionAttempts) {
    const studentUid = String(att.studentUid || att.user_uid || att.userUid || att.student_id || 'unknown');
    const studentName = String(
      att.studentName || att.user_name || att.userName || att.name || 'Student'
    ).trim() || 'Student';
    const studentEmail = att.studentEmail || att.user_email || att.email || undefined;
    const totalQ = Number(att.totalQuestions ?? att.total_questions ?? att.questionCount ?? 0);
    const percentage = Number(att.percentage ?? (totalQ > 0 ? Math.round((topScore / totalQ) * 100) : 100));

    // IDEMPOTENCY CHECK: If certificate already issued for this student and mock, do not duplicate
    const alreadyIssued = certs.find(
      (c) => c.grand_line_id === testId && c.student_uid === studentUid
    );

    if (alreadyIssued) {
      // If already issued, ensure mock_name matches exact current name
      if (alreadyIssued.mock_name !== exactMockName) {
        alreadyIssued.mock_name = exactMockName;
        alreadyIssued.updated_at = now;
      }
      newCertificates.push(alreadyIssued);
      continue;
    }

    const serial = generateCertificateSerial(mockCode, nextSeq++);
    const cert: Certificate = {
      id: `cert_${crypto.randomUUID()}`,
      student_uid: studentUid,
      student_name: studentName,
      student_email: studentEmail,
      grand_line_id: testId,
      mock_name: exactMockName, // EXACT character for character
      mock_code: mockCode,
      rank: 1,
      score: topScore,
      total_questions: totalQ,
      percentage,
      participants_count: participantsCount,
      serial,
      theme_id: themeId,
      signature_version: activeSig ? activeSig.version : 1,
      signatory_name: activeSig ? activeSig.signatory_name : 'Muhammad Hashir',
      signatory_title: activeSig ? activeSig.signatory_title : 'Founder, Boardly',
      signature_data_url: activeSig ? activeSig.signature_data_url : null,
      status: 'valid',
      issued_at: now,
      created_at: now,
      updated_at: now,
    };

    certs.push(cert);
    newCertificates.push(cert);
  }

  saveCertificates(certs);
  return { certificates: newCertificates, count: newCertificates.length };
}

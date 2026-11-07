import type { CertificateTheme } from '../config/certificateThemes';

export type CertificateStatus = 'valid' | 'revoked';

export interface Certificate {
  id: string;
  student_uid: string;
  student_name: string;
  student_email?: string;
  grand_line_id: string;
  mock_name: string; // Exact, character-for-character
  mock_code: string;
  rank: number; // 1 for 1st position (or ties)
  score: number;
  total_questions: number;
  percentage: number;
  participants_count: number;
  serial: string; // BDLY-<mock_code>-<4 digit sequence>
  theme_id: string;
  signature_version: number;
  signatory_name: string;
  signatory_title: string;
  signature_data_url?: string | null;
  status: CertificateStatus;
  issued_at: string | number;
  pdf_r2_key?: string | null;
  png_r2_key?: string | null;
  created_at: string | number;
  updated_at: string | number;
}

export interface CertificateSignatureRecord {
  id: string;
  r2_key: string;
  signatory_name: string;
  signatory_title: string;
  version: number;
  uploaded_by: string;
  signature_data_url?: string | null;
  active: boolean;
  created_at: string | number;
  updated_at?: string | number;
}

export interface VerifyCertificateResult {
  valid: boolean;
  status: CertificateStatus;
  student_name: string;
  mock_name: string;
  rank: number;
  score: number;
  total_questions: number;
  percentage: number;
  participants_count: number;
  serial: string;
  issued_at: string | number;
  signatory_name: string;
  signatory_title: string;
  theme_id: string;
}

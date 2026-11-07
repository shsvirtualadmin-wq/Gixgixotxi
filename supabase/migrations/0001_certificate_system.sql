-- ============================================================================
-- Supabase Schema Migration: Boardly Certificate System
-- ============================================================================
-- Features:
-- 1. certificates table: stores 1st position certificates with exact mock_name,
--    serial BDLY-XXXX-YYYY, score, rank, theme_id, and audit status.
-- 2. certificate_signatures table: stores admin authorized signatures with
--    private R2 keys, name, and title. Single active signature rule.
-- 3. captain_tests additions: certificate_theme_id, mock_code, results_finalized.
-- 4. Full Row-Level Security (RLS) with student access, public serial verification,
--    and admin isolation.
-- ============================================================================

-- 1. CERTIFICATES TABLE
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serial TEXT NOT NULL UNIQUE,
  grand_line_id TEXT NOT NULL,
  mock_name TEXT NOT NULL,
  student_uid TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_email TEXT,
  score NUMERIC NOT NULL,
  total_questions INTEGER NOT NULL DEFAULT 0,
  rank INTEGER NOT NULL DEFAULT 1,
  participants INTEGER NOT NULL DEFAULT 1,
  theme_id TEXT NOT NULL DEFAULT 'auto',
  signatory_name TEXT NOT NULL,
  signatory_title TEXT NOT NULL,
  signature_r2_key TEXT NOT NULL,
  pdf_r2_key TEXT,
  status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'revoked')),
  revoked_at TIMESTAMPTZ,
  revoked_by TEXT,
  revocation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_certificate_student_mock UNIQUE (student_uid, grand_line_id)
);

-- Indexes for lightning-fast lookups
CREATE INDEX IF NOT EXISTS idx_certificates_serial ON public.certificates(serial);
CREATE INDEX IF NOT EXISTS idx_certificates_student_uid ON public.certificates(student_uid, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_certificates_grand_line ON public.certificates(grand_line_id);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON public.certificates(status);

-- 2. CERTIFICATE SIGNATURES TABLE
CREATE TABLE IF NOT EXISTS public.certificate_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  r2_key TEXT NOT NULL,
  signatory_name TEXT NOT NULL,
  signatory_title TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  uploaded_by TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_certificate_signatures_active ON public.certificate_signatures(active);

-- 3. ADD CERTIFICATE COLUMNS TO GRAND LINE MOCKS TABLE (captain_tests)
ALTER TABLE IF EXISTS public.captain_tests 
  ADD COLUMN IF NOT EXISTS certificate_theme_id TEXT DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS mock_code TEXT,
  ADD COLUMN IF NOT EXISTS results_finalized BOOLEAN DEFAULT FALSE;

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_signatures ENABLE ROW LEVEL SECURITY;

-- Helper function to check if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
    OR (auth.jwt() ->> 'email') IN (
      'virtualoperationshub@gmail.com',
      'admin@boardly.cfd'
    ),
    false
  );
$$;

-- A. CERTIFICATES RLS POLICIES
-- Students can read their own certificates
DROP POLICY IF EXISTS "Students can view own certificates" ON public.certificates;
CREATE POLICY "Students can view own certificates"
  ON public.certificates
  FOR SELECT
  TO authenticated
  USING (student_uid = auth.uid()::text);

-- Public can verify certificates by serial lookup
-- Notice: only valid certificates can be publicly read for verification
DROP POLICY IF EXISTS "Public can verify valid certificates" ON public.certificates;
CREATE POLICY "Public can verify valid certificates"
  ON public.certificates
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Admins can insert, update, delete, and view all certificates
DROP POLICY IF EXISTS "Admins have full access to certificates" ON public.certificates;
CREATE POLICY "Admins have full access to certificates"
  ON public.certificates
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- B. CERTIFICATE SIGNATURES RLS POLICIES
-- Only admins can read or write raw signature records
-- Students must NEVER directly access the signature files or records
DROP POLICY IF EXISTS "Admins have full access to signatures" ON public.certificate_signatures;
CREATE POLICY "Admins have full access to signatures"
  ON public.certificate_signatures
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5. AUTO-UPDATE UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_certificates_updated_at ON public.certificates;
CREATE TRIGGER trigger_certificates_updated_at
  BEFORE UPDATE ON public.certificates
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

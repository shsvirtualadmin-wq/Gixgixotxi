/**
 * Payment Deduplication Helper Utilities
 */

export function normalizePackageTrack(raw: string | null | undefined): string {
  if (!raw) return '';
  const s = String(raw).trim().toLowerCase();
  if (s.includes('mdcat')) return 'mdcat';
  if (s.includes('ecat')) return 'ecat';
  if (s.includes('net') || s.includes('nust')) return 'nust_net';
  if (s.includes('fsc') || s.includes('11') || s.includes('12')) return 'fsc';
  if (s.includes('matric') || s.includes('9') || s.includes('10')) return 'matric';
  return s;
}

export interface DuplicatePaymentGroup {
  primary: any;
  original: any;
  duplicates: any[];
}

export function findDuplicatePaymentGroups(requests: any[]): DuplicatePaymentGroup[] {
  if (!Array.isArray(requests) || requests.length <= 1) return [];
  const groups: DuplicatePaymentGroup[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < requests.length; i++) {
    const req = requests[i];
    if (!req || seen.has(req.id)) continue;
    const reqEmail = (req.email || req.student_email || '').toLowerCase().trim();
    const reqTier = normalizePackageTrack(req.package_name || req.course_tier || '');
    const reqRef = (req.transaction_reference || req.tx_ref || '').trim();

    const duplicates: any[] = [];
    for (let j = i + 1; j < requests.length; j++) {
      const other = requests[j];
      if (!other || seen.has(other.id)) continue;
      const otherEmail = (other.email || other.student_email || '').toLowerCase().trim();
      const otherTier = normalizePackageTrack(other.package_name || other.course_tier || '');
      const otherRef = (other.transaction_reference || other.tx_ref || '').trim();

      const isMatch = (reqEmail && reqEmail === otherEmail && reqTier && reqTier === otherTier) ||
        (reqRef && reqRef !== 'WhatsApp Submission' && reqRef === otherRef);

      if (isMatch) {
        duplicates.push(other);
        seen.add(other.id);
      }
    }

    if (duplicates.length > 0) {
      seen.add(req.id);
      groups.push({
        primary: req,
        original: req,
        duplicates,
      });
    }
  }

  return groups;
}

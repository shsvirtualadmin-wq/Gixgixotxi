/**
 * Utilities for normalising package / track names and deduplicating
 * payment verification requests across the application.
 */

export function normalizePackageTrack(raw: string | undefined | null): string {
  if (!raw || typeof raw !== 'string') return 'Standard Plan';
  const clean = raw.trim();
  const lower = clean.toLowerCase();

  // MDCAT variations
  if (lower.includes('mdcat')) {
    return 'PMDC MDCAT';
  }

  // FAST-NU variations (including the FB-ISE prefix glitch)
  if (lower.includes('fast-nu') || lower.includes('fast-nuces') || (lower.includes('fast') && !lower.includes('breakfast'))) {
    return 'FAST-NU (NAT)';
  }

  // NUST NET variations
  if (lower.includes('nust') || lower.includes('net prep') || (lower.includes('net') && !lower.includes('internet') && !lower.includes('network'))) {
    return 'NUST (NET)';
  }

  // TCAT variations
  if (lower.includes('tcat') || (lower.includes('taxila') && lower.includes('uet'))) {
    return 'TCAT (UET Taxila)';
  }

  // ECAT variations
  if (lower.includes('ecat') || (lower.includes('lahore') && lower.includes('uet'))) {
    return 'ECAT (UET Lahore)';
  }

  // ETEA variations
  if (lower.includes('etea') || (lower.includes('peshawar') && lower.includes('uet'))) {
    return 'ETEA (UET Peshawar)';
  }

  // NUMS variations
  if (lower.includes('nums')) {
    return 'NUMS (Medical)';
  }

  // GIKI variations
  if (lower.includes('giki')) {
    return 'GIKI (Engineering)';
  }

  // USAT variations
  if (lower.includes('usat')) {
    return 'USAT (HEC)';
  }

  // NED variations
  if (lower.includes('ned')) {
    return 'NED University';
  }

  // PIEAS variations
  if (lower.includes('pieas')) {
    return 'PIEAS';
  }

  // Aga Khan (AKU) variations
  if (lower.includes('aku') || lower.includes('aga khan')) {
    return 'Aga Khan University (AKU)';
  }

  // LUMS variations
  if (lower.includes('lums')) {
    return 'LUMS';
  }

  // NTS NAT variations
  if (lower.includes('nts nat') || lower.includes('nts-nat')) {
    return 'NTS NAT';
  }

  // IBA Karachi
  if (lower.includes('iba')) {
    return 'IBA Karachi';
  }

  // MUET Jamshoro
  if (lower.includes('muet')) {
    return 'MUET Jamshoro';
  }

  // Matric / 9th / 10th
  if (lower.includes('matric') || lower.includes('9th') || lower.includes('10th') || lower.includes('ssc')) {
    if (lower.includes('9')) return 'FBISE 9';
    if (lower.includes('10')) return 'FBISE 10';
    return 'Matric (9th & 10th)';
  }

  // FSc / 11th / 12th
  if (lower.includes('fsc') || lower.includes('11') || lower.includes('12') || lower.includes('hssc')) {
    if (lower.includes('11')) {
      if (lower.includes('med')) return 'FBISE 11 Pre-Medical';
      if (lower.includes('eng')) return 'FBISE 11 Pre-Engineering';
      if (lower.includes('ics') || lower.includes('cs')) return 'FBISE 11 ICS';
      return 'FBISE 11';
    }
    if (lower.includes('12')) {
      if (lower.includes('med')) return 'FBISE 12 Pre-Medical';
      if (lower.includes('eng')) return 'FBISE 12 Pre-Engineering';
      if (lower.includes('ics') || lower.includes('cs')) return 'FBISE 12 ICS';
      return 'FBISE 12';
    }
    return 'FSc (1st & 2nd Year)';
  }

  return clean;
}

export interface DuplicatePaymentGroup {
  primary: any;
  duplicates: any[];
  reason: 'same_transaction_ref' | 'same_student_track_time';
}

/**
 * Identify duplicate and near-duplicate payment requests in a list.
 * Groups by:
 * 1) Exact non-trivial transaction_ref match (case-insensitive)
 * 2) Same student email + matching canonical track submitted within 24h of each other
 */
export function findDuplicatePaymentGroups(requests: any[]): DuplicatePaymentGroup[] {
  if (!Array.isArray(requests) || requests.length === 0) return [];

  const groups: DuplicatePaymentGroup[] = [];
  const processedIds = new Set<string>();

  // Helper to score a request for choosing the primary record
  const getScore = (r: any): number => {
    let score = 0;
    // Status preference: approved > pending > rejected
    if (r.status === 'approved') score += 1000;
    else if (r.status === 'pending') score += 500;
    else score += 100;

    // Has verified image / screenshot
    const hasImage = Boolean(
      r.proof_url ||
      r.screenshot_url ||
      r.payment_proof_url ||
      (r.drive_file_url && !r.drive_file_url.includes('WhatsApp Submission'))
    );
    if (hasImage) score += 200;

    // Has student_id linked
    if (r.student_id && !r.student_id.startsWith('anon-')) score += 50;

    return score;
  };

  // 1. Group by Transaction Reference
  const txMap = new Map<string, any[]>();
  for (const r of requests) {
    const rawTx = (r.transaction_reference || r.transaction_ref || '').trim();
    // Exclude generic or empty transaction refs
    if (rawTx.length > 0 && !['n/a', 'none', 'na', '0', '-'].includes(rawTx.toLowerCase())) {
      const key = rawTx.toLowerCase();
      if (!txMap.has(key)) txMap.set(key, []);
      txMap.get(key)!.push(r);
    }
  }

  for (const [, items] of txMap.entries()) {
    if (items.length > 1) {
      // Sort items by score desc, then by date asc (earliest first)
      const sorted = [...items].sort((a, b) => {
        const scoreDiff = getScore(b) - getScore(a);
        if (scoreDiff !== 0) return scoreDiff;
        const dateA = new Date(a.submitted_at || a.created_at || 0).getTime();
        const dateB = new Date(b.submitted_at || b.created_at || 0).getTime();
        return dateA - dateB;
      });

      const primary = sorted[0];
      const dupes = sorted.slice(1).filter((d) => !processedIds.has(d.id));

      if (dupes.length > 0) {
        processedIds.add(primary.id);
        dupes.forEach((d) => processedIds.add(d.id));
        groups.push({
          primary,
          duplicates: dupes,
          reason: 'same_transaction_ref',
        });
      }
    }
  }

  // 2. Group by Student Email + Canonical Track within 24 hours
  const remaining = requests.filter((r) => !processedIds.has(r.id));
  const emailTrackMap = new Map<string, any[]>();

  for (const r of remaining) {
    const email = (r.student_email || '').toLowerCase().trim();
    if (!email) continue;
    const track = normalizePackageTrack(r.course_tier || r.package_name || '');
    const key = `${email}::${track}`;
    if (!emailTrackMap.has(key)) emailTrackMap.set(key, []);
    emailTrackMap.get(key)!.push(r);
  }

  for (const [, items] of emailTrackMap.entries()) {
    if (items.length > 1) {
      // Check timestamp closeness (within 24 hours)
      const sorted = [...items].sort((a, b) => {
        const scoreDiff = getScore(b) - getScore(a);
        if (scoreDiff !== 0) return scoreDiff;
        const dateA = new Date(a.submitted_at || a.created_at || 0).getTime();
        const dateB = new Date(b.submitted_at || b.created_at || 0).getTime();
        return dateA - dateB;
      });

      const primary = sorted[0];
      const primaryTime = new Date(primary.submitted_at || primary.created_at || 0).getTime();
      const dupes = sorted.slice(1).filter((d) => {
        if (processedIds.has(d.id)) return false;
        const dTime = new Date(d.submitted_at || d.created_at || 0).getTime();
        // If within 24 hours or both have identical status
        return Math.abs(dTime - primaryTime) < 24 * 60 * 60 * 1000 || (primary.status === d.status && primary.status === 'pending');
      });

      if (dupes.length > 0) {
        processedIds.add(primary.id);
        dupes.forEach((d) => processedIds.add(d.id));
        groups.push({
          primary,
          duplicates: dupes,
          reason: 'same_student_track_time',
        });
      }
    }
  }

  return groups;
}

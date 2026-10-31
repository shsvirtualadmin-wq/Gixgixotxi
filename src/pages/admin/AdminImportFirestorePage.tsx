import React, { useState } from 'react';
import { Database, Play, CheckCircle2, AlertTriangle, RefreshCw, ShieldCheck } from 'lucide-react';
import { TARGET_PROJECT_ID, TARGET_DATABASE_ID } from '@/lib/firebase';
import { api, getBearerToken, showApiToast } from '@/lib/api';

interface CollectionImportTarget {
  id: string;
  label: string;
  description: string;
}

const FIRESTORE_COLLECTIONS_TO_IMPORT: CollectionImportTarget[] = [
  { id: 'users', label: 'Users & Roles', description: 'Student profiles, plans, streaks, stats, and role assignments' },
  { id: 'publicProfiles', label: 'Public Profiles', description: 'Leaderboard profiles, avatars, frames, and public stats' },
  { id: 'usernames', label: 'Usernames Registry', description: 'Unique @username reservations' },
  { id: 'wallets', label: 'Koban Wallets', description: 'Koban balances, owned cosmetics, and equipped items' },
  { id: 'store_items', label: 'Store Items & Prices', description: 'Custom store item prices and active states' },
  { id: 'coupons', label: 'Coupons', description: 'Koban reward and store discount coupon codes' },
  { id: 'kobanRequests', label: 'Koban Requests', description: 'Student Koban purchase and grant requests' },
  { id: 'paymentRequests', label: 'Payment Requests', description: 'Boardly Pro subscription payment verifications' },
  { id: 'attempts', label: 'Practice & Mock Attempts', description: 'Completed and in-progress student practice test attempts' },
  { id: 'streaks', label: 'User Streaks', description: '7-day and 28-day student study streak records' },
  { id: 'referrals', label: 'Referrals', description: 'Captain and student referral attribution records' },
  { id: 'captains', label: 'Nakama Captains', description: 'Captain leaderboard profiles, tiers, and points' },
  { id: 'crews', label: 'Crews', description: 'Nakama study crews and university chapters' },
  { id: 'captainApplications', label: 'Captain Applications', description: 'Applications to become a Nakama Captain' },
  { id: 'crewApplications', label: 'Crew Applications', description: 'Student applications to join Boardly Crews' },
  { id: 'nameRequests', label: 'Name Change Requests', description: 'Student display name change requests' },
  { id: 'reviews', label: 'Student Reviews', description: 'Student testimonials and ratings' },
  { id: 'questionReports', label: 'Question Reports', description: 'Reported MCQ issues and errata' },
  { id: 'supportTickets', label: 'Support Tickets', description: 'Contact form and student support tickets' },
  { id: 'config', label: 'App Config', description: 'Crew pricing and taxonomy configurations' },
  { id: 'auditLogs', label: 'Admin Audit Logs', description: 'Historical administrative audit log entries' },
];

interface CollectionImportStats {
  collection: string;
  label: string;
  totalRead: number;
  imported: number;
  skipped: number;
  failed: number;
  status: 'idle' | 'running' | 'completed' | 'error';
  errorMessage?: string;
}

/**
 * Unwraps a Firestore REST API Value object into a plain JS value,
 * converting timestamps to epoch milliseconds.
 */
function unwrapFirestoreRestValue(valObj: any): any {
  if (!valObj || typeof valObj !== 'object') return null;
  if ('nullValue' in valObj) return null;
  if ('booleanValue' in valObj) return Boolean(valObj.booleanValue);
  if ('integerValue' in valObj) return Number(valObj.integerValue);
  if ('doubleValue' in valObj) return Number(valObj.doubleValue);
  if ('stringValue' in valObj) return String(valObj.stringValue);
  if ('timestampValue' in valObj) {
    const ms = Date.parse(String(valObj.timestampValue));
    return Number.isFinite(ms) ? ms : Date.now();
  }
  if ('arrayValue' in valObj) {
    const values = valObj.arrayValue?.values;
    return Array.isArray(values) ? values.map(unwrapFirestoreRestValue) : [];
  }
  if ('mapValue' in valObj) {
    const fields = valObj.mapValue?.fields || {};
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(fields)) {
      out[k] = unwrapFirestoreRestValue(v);
    }
    return out;
  }
  return null;
}

/**
 * Fetches all documents from a Firestore collection via the official Firestore REST API
 * using the current user's Firebase Auth ID token (read-only backup fetch, zero SDK dependency).
 */
async function fetchFirestoreCollectionReadOnly(
  collectionName: string,
  idToken: string
): Promise<Array<Record<string, any>>> {
  const results: Array<Record<string, any>> = [];
  const databasesToTry = Array.from(new Set([TARGET_DATABASE_ID, '(default)']));

  for (const dbId of databasesToTry) {
    let pageToken = '';
    let foundInDb = false;

    for (let page = 0; page < 25; page++) {
      const url = new URL(
        `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
          TARGET_PROJECT_ID
        )}/databases/${encodeURIComponent(dbId)}/documents/${encodeURIComponent(collectionName)}`
      );
      url.searchParams.set('pageSize', '100');
      if (pageToken) url.searchParams.set('pageToken', pageToken);

      const resp = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!resp.ok) {
        break;
      }

      const data = (await resp.json().catch(() => ({}))) as {
        documents?: Array<{ name: string; fields?: Record<string, any>; createTime?: string; updateTime?: string }>;
        nextPageToken?: string;
      };

      const docs = data.documents || [];
      if (docs.length > 0) {
        foundInDb = true;
      }

      for (const d of docs) {
        const docId = String(d.name || '').split('/').pop() || '';
        const unwrapped: Record<string, any> = { id: docId };
        const fields = d.fields || {};
        for (const [k, v] of Object.entries(fields)) {
          unwrapped[k] = unwrapFirestoreRestValue(v);
        }
        if (!unwrapped.createdAt && d.createTime) {
          const ms = Date.parse(d.createTime);
          if (Number.isFinite(ms)) unwrapped.createdAt = ms;
        }
        if (!unwrapped.updatedAt && d.updateTime) {
          const ms = Date.parse(d.updateTime);
          if (Number.isFinite(ms)) unwrapped.updatedAt = ms;
        }
        results.push(unwrapped);
      }

      if (!data.nextPageToken) break;
      pageToken = data.nextPageToken;
    }

    if (foundInDb) break;
  }

  return results;
}

export const AdminImportFirestorePage: React.FC = () => {
  const [running, setRunning] = useState(false);
  const [currentCollection, setCurrentCollection] = useState<string | null>(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const [statsMap, setStatsMap] = useState<Record<string, CollectionImportStats>>(() => {
    const initial: Record<string, CollectionImportStats> = {};
    for (const c of FIRESTORE_COLLECTIONS_TO_IMPORT) {
      initial[c.id] = {
        collection: c.id,
        label: c.label,
        totalRead: 0,
        imported: 0,
        skipped: 0,
        failed: 0,
        status: 'idle',
      };
    }
    return initial;
  });

  const handleRunImport = async () => {
    if (running) return;
    setRunning(true);
    setProgressPercent(0);

    try {
      const idToken = await getBearerToken(true);
      if (!idToken) {
        showApiToast('Authentication required. Please sign in as superadmin.', 'error');
        setRunning(false);
        return;
      }

      const totalCollections = FIRESTORE_COLLECTIONS_TO_IMPORT.length;
      for (let idx = 0; idx < totalCollections; idx++) {
        const target = FIRESTORE_COLLECTIONS_TO_IMPORT[idx];
        setCurrentCollection(target.label);
        setStatsMap((prev) => ({
          ...prev,
          [target.id]: {
            ...prev[target.id],
            status: 'running',
            totalRead: 0,
            imported: 0,
            skipped: 0,
            failed: 0,
            errorMessage: undefined,
          },
        }));

        try {
          const docs = await fetchFirestoreCollectionReadOnly(target.id, idToken);
          let colImported = 0;
          let colSkipped = 0;
          let colFailed = 0;

          // Send in batches of max 50 items per request
          const BATCH_SIZE = 50;
          for (let b = 0; b < docs.length; b += BATCH_SIZE) {
            const chunk = docs.slice(b, b + BATCH_SIZE);
            const res = await api.post<{
              ok: boolean;
              imported: number;
              skipped: number;
              failed: number;
            }>('/api/admin/import-firestore', {
              collection: target.id,
              documents: chunk,
            });
            colImported += Number(res.imported || 0);
            colSkipped += Number(res.skipped || 0);
            colFailed += Number(res.failed || 0);
          }

          setStatsMap((prev) => ({
            ...prev,
            [target.id]: {
              ...prev[target.id],
              totalRead: docs.length,
              imported: colImported,
              skipped: colSkipped,
              failed: colFailed,
              status: 'completed',
            },
          }));
        } catch (err: any) {
          setStatsMap((prev) => ({
            ...prev,
            [target.id]: {
              ...prev[target.id],
              status: 'error',
              errorMessage: err?.message || 'Batch import failed',
            },
          }));
        }

        setProgressPercent(Math.round(((idx + 1) / totalCollections) * 100));
      }

      showApiToast('One-time Firebase to Cloudflare D1 import completed!', 'success');
    } finally {
      setCurrentCollection(null);
      setRunning(false);
    }
  };

  const rows: CollectionImportStats[] = FIRESTORE_COLLECTIONS_TO_IMPORT.map(
    (t) => statsMap[t.id]
  );
  const totalImported = rows.reduce((acc, r) => acc + r.imported, 0);
  const totalSkipped = rows.reduce((acc, r) => acc + r.skipped, 0);
  const totalFailed = rows.reduce((acc, r) => acc + r.failed, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="rounded-2xl border border-white/10 bg-[#121215] p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              Superadmin Migration Tool
            </div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
              <Database className="w-6 h-6 text-[#D71921]" />
              Import old data from Firebase
            </h1>
            <p className="text-sm text-zinc-400 max-w-2xl">
              Reads legacy collections from Firebase Firestore (read-only backup), converts timestamps
              to milliseconds and booleans to 0/1, and imports them into Cloudflare D1 (
              <code className="text-zinc-200">boardly-posts-db</code>) in safe 50-item batches using{' '}
              <code className="text-zinc-200">INSERT OR IGNORE</code>.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRunImport}
            disabled={running}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm bg-[#D71921] hover:bg-[#b8141b] disabled:opacity-50 text-white shadow-lg transition cursor-pointer shrink-0"
          >
            {running ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Importing ({progressPercent}%)...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Start One-Time D1 Import
              </>
            )}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>
              {running && currentCollection
                ? `Importing ${currentCollection}...`
                : progressPercent === 100
                ? 'Import complete'
                : 'Ready to import'}
            </span>
            <span className="font-mono font-semibold text-zinc-200">{progressPercent}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-white/5 overflow-hidden border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-[#D71921] to-emerald-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Summary Counters */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
            <div className="text-xs text-zinc-400">Total Imported / Verified</div>
            <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">{totalImported}</div>
          </div>
          <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
            <div className="text-xs text-zinc-400">Skipped (Already in D1)</div>
            <div className="text-2xl font-bold text-zinc-200 font-mono mt-1">{totalSkipped}</div>
          </div>
          <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
            <div className="text-xs text-zinc-400">Failed</div>
            <div className="text-2xl font-bold text-amber-400 font-mono mt-1">{totalFailed}</div>
          </div>
        </div>
      </div>

      {/* Per-Collection Table */}
      <div className="rounded-2xl border border-white/10 bg-[#121215] overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Audited Firestore Collections ({FIRESTORE_COLLECTIONS_TO_IMPORT.length})
          </h2>
          <span className="text-xs text-zinc-400">Max 50 items per batch • INSERT OR IGNORE</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs text-zinc-400 uppercase bg-white/[0.02]">
                <th className="py-3 px-4">Collection</th>
                <th className="py-3 px-4">Found</th>
                <th className="py-3 px-4">Imported</th>
                <th className="py-3 px-4">Skipped</th>
                <th className="py-3 px-4">Failed</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {FIRESTORE_COLLECTIONS_TO_IMPORT.map((col) => {
                const st = statsMap[col.id];
                return (
                  <tr key={col.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-4">
                      <div className="font-medium text-zinc-100">{col.label}</div>
                      <div className="text-xs text-zinc-500 font-mono">{col.id}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-300">{st.totalRead}</td>
                    <td className="py-3 px-4 font-mono text-emerald-400 font-semibold">{st.imported}</td>
                    <td className="py-3 px-4 font-mono text-zinc-400">{st.skipped}</td>
                    <td className="py-3 px-4 font-mono text-amber-400">{st.failed}</td>
                    <td className="py-3 px-4">
                      {st.status === 'idle' && (
                        <span className="text-xs text-zinc-500">Ready</span>
                      )}
                      {st.status === 'running' && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-amber-300">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Importing...
                        </span>
                      )}
                      {st.status === 'completed' && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Done
                        </span>
                      )}
                      {st.status === 'error' && (
                        <span
                          className="inline-flex items-center gap-1.5 text-xs text-red-400"
                          title={st.errorMessage}
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {st.errorMessage || 'Error'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminImportFirestorePage;

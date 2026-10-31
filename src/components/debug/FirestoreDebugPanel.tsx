import { useState, useEffect, useCallback } from 'react';
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  collection,
  query,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, TARGET_DATABASE_ID } from '@/lib/firebase';
import { RefreshCw, CheckCircle2, XCircle, ShieldCheck, Database, Wifi } from 'lucide-react';

interface DiagnosticResult<T = unknown> {
  status: 'idle' | 'running' | 'success' | 'error';
  durationMs?: number;
  data?: T;
  error?: {
    code?: string;
    message?: string;
    stack?: string;
  };
}

export function FirestoreDebugPanel() {
  const [running, setRunning] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // A) db.app.options.projectId and databaseId
  const dbProjectId = db.app.options.projectId || '(undefined)';
  const dbPassedId = TARGET_DATABASE_ID;
  const dbInternalId = ((db as unknown as { _databaseId?: { database?: string; projectId?: string } })._databaseId?.database) || TARGET_DATABASE_ID;

  // B) auth.app.options.projectId and currentUser
  const currentUser = auth.currentUser;
  const authProjectId = auth.app.options.projectId || '(undefined)';
  const authUid = currentUser?.uid || '(Not Signed In)';
  const authEmail = currentUser?.email || '(None)';

  // C) Token claims
  const [tokenClaims, setTokenClaims] = useState<Record<string, unknown> | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // D) getDoc test
  const [getDocTest, setGetDocTest] = useState<DiagnosticResult<{ exists: boolean; dataSnippet?: string }>>({
    status: 'idle',
  });

  // E) getDocs test
  const [getDocsTest, setGetDocsTest] = useState<DiagnosticResult<{ count: number; sampleDocId?: string }>>({
    status: 'idle',
  });

  // F) setDoc debugPing test
  const [setDocTest, setSetDocTest] = useState<DiagnosticResult<{ pingConfirmed: boolean }>>({
    status: 'idle',
  });

  useEffect(() => {
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const runDiagnostics = useCallback(async () => {
    setRunning(true);

    // C) Fetch fresh ID token result with forced refresh
    if (auth.currentUser) {
      try {
        const tokenResult = await auth.currentUser.getIdTokenResult(true);
        setTokenClaims({
          aud: tokenResult.claims.aud,
          iss: tokenResult.claims.iss,
          email: tokenResult.claims.email,
          email_verified: tokenResult.claims.email_verified,
          role: tokenResult.claims.role,
          auth_time: tokenResult.claims.auth_time,
          exp: tokenResult.claims.exp,
        });
        setTokenError(null);
      } catch (err: unknown) {
        const e = err as { code?: string; message?: string };
        setTokenError(`${e.code ?? 'ERROR'}: ${e.message ?? String(err)}`);
        setTokenClaims(null);
      }
    } else {
      setTokenClaims(null);
      setTokenError('No authenticated user session found in Firebase Auth.');
    }

    // D) Test getDoc(doc(db, "users", auth.currentUser.uid))
    if (auth.currentUser?.uid) {
      const uid = auth.currentUser.uid;
      setGetDocTest({ status: 'running' });
      const t0 = performance.now();
      try {
        const snap = await getDoc(doc(db, 'users', uid));
        const durationMs = Math.round(performance.now() - t0);
        setGetDocTest({
          status: 'success',
          durationMs,
          data: {
            exists: snap.exists(),
            dataSnippet: snap.exists() ? JSON.stringify(snap.data()).slice(0, 160) : undefined,
          },
        });
      } catch (err: unknown) {
        const durationMs = Math.round(performance.now() - t0);
        const e = err as { code?: string; message?: string };
        setGetDocTest({
          status: 'error',
          durationMs,
          error: { code: e.code || 'UNKNOWN', message: e.message || String(err) },
        });
      }
    } else {
      setGetDocTest({
        status: 'error',
        error: { code: 'UNAUTHENTICATED', message: 'Cannot read users/{uid} because currentUser is null.' },
      });
    }

    // E) Test getDocs(query(collection(db, "users"), limit(1)))
    setGetDocsTest({ status: 'running' });
    const tDocs0 = performance.now();
    try {
      const q = query(collection(db, 'users'), limit(1));
      const snap = await getDocs(q);
      const durationMs = Math.round(performance.now() - tDocs0);
      setGetDocsTest({
        status: 'success',
        durationMs,
        data: {
          count: snap.size,
          sampleDocId: snap.docs[0]?.id,
        },
      });
    } catch (err: unknown) {
      const durationMs = Math.round(performance.now() - tDocs0);
      const e = err as { code?: string; message?: string };
      setGetDocsTest({
        status: 'error',
        durationMs,
        error: { code: e.code || 'UNKNOWN', message: e.message || String(err) },
      });
    }

    // F) Test setDoc with { debugPing: true } merged into user's own doc (with 15s timeout)
    if (auth.currentUser?.uid) {
      const uid = auth.currentUser.uid;
      setSetDocTest({ status: 'running' });
      const tSet0 = performance.now();
      try {
        const setDocPromise = setDoc(
          doc(db, 'users', uid),
          {
            debugPing: true,
            lastPingAt: serverTimestamp(),
          },
          { merge: true }
        );

        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            const err = new Error('setDoc write took over 15s (queued in background)');
            (err as { code?: string }).code = 'TIMEOUT_15S';
            reject(err);
          }, 15000);
        });

        await Promise.race([setDocPromise, timeoutPromise]);
        const durationMs = Math.round(performance.now() - tSet0);
        setSetDocTest({
          status: 'success',
          durationMs,
          data: { pingConfirmed: true },
        });
      } catch (err: unknown) {
        const durationMs = Math.round(performance.now() - tSet0);
        const e = err as { code?: string; message?: string };
        setSetDocTest({
          status: 'error',
          durationMs,
          error: { code: e.code || 'UNKNOWN', message: e.message || String(err) },
        });
      }
    } else {
      setSetDocTest({
        status: 'error',
        error: { code: 'UNAUTHENTICATED', message: 'Cannot write debugPing because currentUser is null.' },
      });
    }

    setRunning(false);
  }, []);

  useEffect(() => {
    runDiagnostics();
  }, [runDiagnostics]);

  const audClaim = tokenClaims?.aud as string | undefined;
  const audMatches = audClaim ? audClaim === dbProjectId : null;

  return (
    <div
      role="region"
      aria-label="Firestore Diagnostic Debug Panel"
      className="my-6 rounded-2xl bg-[#0a0a14] border-2 border-indigo-500/70 text-gray-100 p-5 shadow-2xl overflow-hidden font-sans"
    >
      {/* ─── PANEL HEADER ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-indigo-500/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400 flex items-center justify-center text-indigo-400">
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Firestore Live Diagnostic Panel
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-600/40 text-indigo-200 border border-indigo-400/50 uppercase">
                Task A Step 1
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Real runtime values directly from initialized Firebase SDK instances.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-[11px] font-mono text-gray-400 bg-black/60 px-2.5 py-1 rounded-lg border border-gray-800">
            Build:{' '}
            <span className="text-emerald-400 font-semibold">
              {typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 'dev-local'}
            </span>
          </div>

          <button
            type="button"
            onClick={runDiagnostics}
            disabled={running}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-semibold cursor-pointer transition-all disabled:opacity-50"
          >
            <RefreshCw size={13} className={running ? 'animate-spin' : ''} />
            <span>{running ? 'Running…' : 'Re-run Tests'}</span>
          </button>
        </div>
      </div>

      {/* ─── SECTION A, B, G: INSTANCES & NETWORK ───────────────────────────── */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        {/* A) Firestore Database Configuration */}
        <div className="p-3.5 rounded-xl bg-black/50 border border-indigo-500/20">
          <div className="flex items-center gap-1.5 text-indigo-300 font-semibold uppercase text-[10px] mb-1.5">
            <Database size={13} />
            <span>a) db Configuration</span>
          </div>
          <div className="space-y-1 font-mono text-[11px]">
            <div>
              <span className="text-gray-400">db.app.options.projectId: </span>
              <span className="text-emerald-300 font-bold">{dbProjectId}</span>
            </div>
            <div>
              <span className="text-gray-400">Passed databaseId: </span>
              <span className="text-cyan-300 break-all">{dbPassedId}</span>
            </div>
            <div>
              <span className="text-gray-400">Resolved internal databaseId: </span>
              <span className="text-gray-200 break-all">{dbInternalId}</span>
            </div>
          </div>
        </div>

        {/* B) Auth Configuration */}
        <div className="p-3.5 rounded-xl bg-black/50 border border-indigo-500/20">
          <div className="flex items-center gap-1.5 text-indigo-300 font-semibold uppercase text-[10px] mb-1.5">
            <ShieldCheck size={13} />
            <span>b) auth Configuration</span>
          </div>
          <div className="space-y-1 font-mono text-[11px]">
            <div>
              <span className="text-gray-400">auth.app.options.projectId: </span>
              <span className="text-emerald-300 font-bold">{authProjectId}</span>
            </div>
            <div>
              <span className="text-gray-400">auth.currentUser.email: </span>
              <span className="text-white font-semibold truncate block">{authEmail}</span>
            </div>
            <div>
              <span className="text-gray-400">auth.currentUser.uid: </span>
              <span className="text-yellow-300 break-all block">{authUid}</span>
            </div>
          </div>
        </div>

        {/* G) Network & Offline Mode */}
        <div className="p-3.5 rounded-xl bg-black/50 border border-indigo-500/20">
          <div className="flex items-center gap-1.5 text-indigo-300 font-semibold uppercase text-[10px] mb-1.5">
            <Wifi size={13} />
            <span>g) Network & Connectivity</span>
          </div>
          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">navigator.onLine:</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  onlineStatus ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/40' : 'bg-red-900/60 text-red-300 border border-red-500/40'
                }`}
              >
                {onlineStatus ? 'ONLINE (true)' : 'OFFLINE (false)'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Transport:</span>
              <span className="text-cyan-300 font-bold">ForceLongPolling</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Session Status:</span>
              <span className={currentUser ? 'text-emerald-300 font-bold' : 'text-amber-400 font-bold'}>
                {currentUser ? 'AUTHENTICATED' : 'ANONYMOUS / GUEST'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── SECTION C: ID TOKEN CLAIMS ──────────────────────────────────────── */}
      <div className="mt-3 p-3.5 rounded-xl bg-black/50 border border-indigo-500/20">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-indigo-300 font-semibold uppercase text-[10px]">
              c) auth.currentUser.getIdTokenResult(true) Claims
            </span>
            {audMatches === true && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/50">
                <CheckCircle2 size={11} /> aud matches Firestore projectId
              </span>
            )}
            {audMatches === false && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-500/50">
                <XCircle size={11} /> AUD MISMATCH: aud !== projectId!
              </span>
            )}
          </div>
        </div>

        {tokenError && (
          <div className="text-xs text-red-400 font-mono bg-red-950/40 p-2 rounded-lg border border-red-500/30">
            {tokenError}
          </div>
        )}

        {tokenClaims && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 font-mono text-[11px]">
            <div className="p-2 rounded bg-black/60 border border-gray-800">
              <span className="text-gray-500 text-[9px] uppercase block">claims.aud</span>
              <span className={`font-bold truncate block ${audMatches ? 'text-emerald-300' : 'text-red-400'}`}>
                {String(tokenClaims.aud ?? '—')}
              </span>
            </div>

            <div className="p-2 rounded bg-black/60 border border-gray-800">
              <span className="text-gray-500 text-[9px] uppercase block">claims.iss</span>
              <span className="text-gray-300 truncate block">{String(tokenClaims.iss ?? '—')}</span>
            </div>

            <div className="p-2 rounded bg-black/60 border border-gray-800">
              <span className="text-gray-500 text-[9px] uppercase block">claims.email</span>
              <span className="text-gray-300 truncate block">{String(tokenClaims.email ?? '—')}</span>
            </div>

            <div className="p-2 rounded bg-black/60 border border-gray-800">
              <span className="text-gray-500 text-[9px] uppercase block">claims.email_verified</span>
              <span
                className={`font-bold ${
                  tokenClaims.email_verified ? 'text-emerald-300' : 'text-amber-400'
                }`}
              >
                {String(tokenClaims.email_verified)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ─── SECTION D, E, F: LIVE OPERATION TESTS ───────────────────────────── */}
      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* D) getDoc test */}
        <div className="p-3.5 rounded-xl bg-black/50 border border-indigo-500/20">
          <div className="flex items-center justify-between gap-1 mb-2">
            <span className="text-indigo-300 font-semibold uppercase text-[10px]">
              d) getDoc(users/{'{uid}'})
            </span>
            <TestStatusBadge status={getDocTest.status} durationMs={getDocTest.durationMs} />
          </div>

          {getDocTest.status === 'success' && (
            <div className="text-[11px] font-mono text-gray-300 space-y-1">
              <div>
                <span className="text-gray-500">Document exists: </span>
                <span className={getDocTest.data?.exists ? 'text-emerald-300 font-bold' : 'text-amber-400 font-bold'}>
                  {String(getDocTest.data?.exists)}
                </span>
              </div>
              {getDocTest.data?.dataSnippet && (
                <div className="p-1.5 rounded bg-black/80 text-[10px] text-gray-400 break-all border border-gray-800 mt-1">
                  {getDocTest.data.dataSnippet}…
                </div>
              )}
            </div>
          )}

          {getDocTest.status === 'error' && (
            <div className="text-[11px] font-mono text-red-400 bg-red-950/40 p-2 rounded-lg border border-red-500/30 space-y-0.5">
              <div className="font-bold text-red-300">Code: {getDocTest.error?.code}</div>
              <div className="text-[10px] break-words text-red-200">{getDocTest.error?.message}</div>
            </div>
          )}
        </div>

        {/* E) getDocs test */}
        <div className="p-3.5 rounded-xl bg-black/50 border border-indigo-500/20">
          <div className="flex items-center justify-between gap-1 mb-2">
            <span className="text-indigo-300 font-semibold uppercase text-[10px]">
              e) getDocs(users, limit(1))
            </span>
            <TestStatusBadge status={getDocsTest.status} durationMs={getDocsTest.durationMs} />
          </div>

          {getDocsTest.status === 'success' && (
            <div className="text-[11px] font-mono text-gray-300 space-y-1">
              <div>
                <span className="text-gray-500">Query result docs: </span>
                <span className="text-emerald-300 font-bold">{getDocsTest.data?.count} doc(s)</span>
              </div>
              {getDocsTest.data?.sampleDocId && (
                <div>
                  <span className="text-gray-500">Sample doc ID: </span>
                  <span className="text-cyan-300 break-all">{getDocsTest.data.sampleDocId}</span>
                </div>
              )}
            </div>
          )}

          {getDocsTest.status === 'error' && (
            <div className="text-[11px] font-mono text-red-400 bg-red-950/40 p-2 rounded-lg border border-red-500/30 space-y-0.5">
              <div className="font-bold text-red-300">Code: {getDocsTest.error?.code}</div>
              <div className="text-[10px] break-words text-red-200">{getDocsTest.error?.message}</div>
            </div>
          )}
        </div>

        {/* F) setDoc debugPing test */}
        <div className="p-3.5 rounded-xl bg-black/50 border border-indigo-500/20">
          <div className="flex items-center justify-between gap-1 mb-2">
            <span className="text-indigo-300 font-semibold uppercase text-[10px]">
              f) setDoc({'{debugPing: true}'})
            </span>
            <TestStatusBadge status={setDocTest.status} durationMs={setDocTest.durationMs} />
          </div>

          {setDocTest.status === 'success' && (
            <div className="text-[11px] font-mono text-gray-300 space-y-1">
              <div>
                <span className="text-gray-500">Write Ack: </span>
                <span className="text-emerald-300 font-bold">Successfully merged!</span>
              </div>
              <div>
                <span className="text-gray-500">Latency: </span>
                <span className="text-cyan-300 font-bold">{setDocTest.durationMs}ms</span>
              </div>
            </div>
          )}

          {setDocTest.status === 'error' && (
            <div className="text-[11px] font-mono text-red-400 bg-red-950/40 p-2 rounded-lg border border-red-500/30 space-y-0.5">
              <div className="font-bold text-red-300">Code: {setDocTest.error?.code}</div>
              <div className="text-[10px] break-words text-red-200">{setDocTest.error?.message}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TestStatusBadge({
  status,
  durationMs,
}: {
  status: 'idle' | 'running' | 'success' | 'error';
  durationMs?: number;
}) {
  if (status === 'running') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-yellow-300 bg-yellow-950/60 px-2 py-0.5 rounded border border-yellow-500/40">
        <RefreshCw size={10} className="animate-spin" /> Testing…
      </span>
    );
  }
  if (status === 'success') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40">
        <CheckCircle2 size={11} /> SUCCESS {durationMs !== undefined ? `(${durationMs}ms)` : ''}
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-red-300 bg-red-950/60 px-2 py-0.5 rounded border border-red-500/40">
        <XCircle size={11} /> FAILED {durationMs !== undefined ? `(${durationMs}ms)` : ''}
      </span>
    );
  }
  return (
    <span className="text-[10px] font-mono text-gray-500 bg-black/40 px-2 py-0.5 rounded border border-gray-800">
      IDLE
    </span>
  );
}

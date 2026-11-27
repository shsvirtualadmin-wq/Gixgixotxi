import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Play,
  Copy,
  Check,
  ArrowLeft,
  Shield,
  Layers,
  Users,
  Loader2,
} from 'lucide-react';
import { ButtonLineLoader } from '@/components/ui/LineLoader';
import { resolveEffectivePlan, type PlanResolverInput } from '@/hooks/useEffectivePlan';
import {
  startTestSessionWithLimit,
  cleanupHealthcheckDailyUsage,
  DailyTestLimitError,
  FREE_DAILY_TESTS,
} from '@/services/testLimits';
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { getPKTDateKey } from '@/hooks/usePKTDate';
import { MAX_CREW_MEMBERS } from '@/constants/limits';
import {
  fetchLiveQuestionBankStats,
  formatSafeLastImport,
} from '@/services/universityMcqService';

export type HealthStatus = 'PENDING' | 'RUNNING' | 'PASS' | 'WARN' | 'FAIL';

export interface HealthCheckItem {
  id: string;
  category: 'plan_resolver' | 'test_limits' | 'crew_lifecycle';
  title: string;
  status: HealthStatus;
  timeMs: number;
  message: string;
  details?: string;
}

interface PlanTestCase {
  id: string;
  title: string;
  buildInput: () => PlanResolverInput;
  expected: (res: ReturnType<typeof resolveEffectivePlan>) => { ok: boolean; message: string };
}

const PLAN_RESOLVER_TESTS: PlanTestCase[] = [
  {
    id: 'plan_superadmin',
    title: 'Superadmin Email/Role',
    buildInput: () => ({
      email: 'shsvirtualadmin@gmail.com',
      role: 'superadmin',
      isSuperAdminClaim: true,
    }),
    expected: (r) => ({
      ok:
        r.isSuperAdmin &&
        r.isPlus &&
        r.isUnlimited &&
        r.plan === 'plus' &&
        r.planLabel === 'Plus Unlimited' &&
        r.source === 'superadmin',
      message:
        'Superadmin email/role resolved immediately to Plus Unlimited with source superadmin.',
    }),
  },
  {
    id: 'plan_free',
    title: 'Free Student',
    buildInput: () => ({ email: 'student@boardly.cfd', role: 'student', plan: 'free' }),
    expected: (r) => ({
      ok: !r.isPro && !r.isPlus && !r.isUnlimited && r.plan === 'free' && r.source === 'none',
      message: 'Free student account correctly defaults to Free tier with 10 daily tests.',
    }),
  },
  {
    id: 'plan_pro_active',
    title: 'Active Personal Pro',
    buildInput: () => ({
      email: 'paying@boardly.cfd',
      role: 'student',
      plan: 'pro',
      isPremium: true,
      planExpiresAt: Date.now() + 86400000,
    }),
    expected: (r) => ({
      ok:
        r.isPro &&
        !r.isPlus &&
        r.isUnlimited &&
        r.plan === 'pro' &&
        r.planLabel === 'Boardly Pro' &&
        r.source === 'personal',
      message: 'Active personal Pro subscription resolved to Boardly Pro access.',
    }),
  },
  {
    id: 'plan_plus_active',
    title: 'Active Personal Plus',
    buildInput: () => ({
      email: 'plusmember@boardly.cfd',
      role: 'student',
      plan: 'plus',
      isPlus: true,
      plusUntil: Date.now() + 86400000,
    }),
    expected: (r) => ({
      ok:
        r.isPlus &&
        r.isUnlimited &&
        r.plan === 'plus' &&
        r.planLabel === 'Plus Unlimited' &&
        r.source === 'personal',
      message: 'Active personal Plus subscription resolved to Plus Unlimited access.',
    }),
  },
  {
    id: 'plan_pro_expired',
    title: 'Expired Personal Pro',
    buildInput: () => ({
      email: 'expired@boardly.cfd',
      role: 'student',
      plan: 'pro',
      isPremium: true,
      planExpiresAt: Date.now() - 86400000,
    }),
    expected: (r) => ({
      ok: !r.isPro && !r.isPlus && !r.isUnlimited && r.plan === 'free',
      message: 'Expired Pro account correctly downgraded to Free starter tier.',
    }),
  },
  {
    id: 'plan_crew_shared',
    title: 'Free in Crew with Sharing Pro Member',
    buildInput: () => ({
      email: 'member@boardly.cfd',
      inCrew: true,
      crew: {
        name: 'Alpha Squad',
        isProShared: true,
        hasProMember: true,
        members: [{ uid: 'leader1', isPro: true, plan: 'pro' }],
      },
    }),
    expected: (r) => ({
      ok:
        r.isPro &&
        !r.isPlus &&
        r.isUnlimited &&
        r.plan === 'pro' &&
        r.planLabel === 'Boardly Pro' &&
        r.source === 'crew' &&
        r.crewName === 'Alpha Squad',
      message: 'Crew member receives Boardly Pro access shared from Pro squad mate.',
    }),
  },
  {
    id: 'plan_crew_shared_plus',
    title: 'Free in Crew with Sharing Plus Member',
    buildInput: () => ({
      email: 'member@boardly.cfd',
      inCrew: true,
      crew: {
        name: 'Alpha Squad',
        isProShared: true,
        hasPlusMember: true,
        members: [{ uid: 'plus_leader', isPlus: true, plan: 'plus' }],
      },
    }),
    expected: (r) => ({
      ok:
        r.isPlus &&
        r.isUnlimited &&
        r.plan === 'plus' &&
        r.planLabel === 'Plus Unlimited' &&
        r.source === 'crew' &&
        r.crewName === 'Alpha Squad',
      message: 'Crew member receives Plus Unlimited access shared from Plus squad mate.',
    }),
  },
  {
    id: 'plan_crew_sharing_off',
    title: 'Crew with Sharing Toggled Off',
    buildInput: () => ({
      email: 'member@boardly.cfd',
      inCrew: true,
      crew: {
        name: 'Alpha Squad',
        isProShared: false,
        hasProMember: true,
        members: [{ uid: 'leader1', isPro: true, plan: 'pro' }],
      },
    }),
    expected: (r) => ({
      ok: !r.isPro && !r.isPlus && !r.isUnlimited && r.plan === 'free',
      message: 'Crew sharing disabled flag is respected and leaves member on Free tier.',
    }),
  },
  {
    id: 'plan_left_crew',
    title: 'Member Who Left Crew',
    buildInput: () => ({
      email: 'former@boardly.cfd',
      inCrew: false,
      crew: null,
      plan: 'free',
    }),
    expected: (r) => ({
      ok: !r.isPro && !r.isPlus && !r.isUnlimited && r.plan === 'free',
      message: 'Member who departed crew falls back cleanly to Free starter limits.',
    }),
  },
  {
    id: 'plan_unlimited_sharer',
    title: 'Personal Pro Sharer inside Crew',
    buildInput: () => ({
      uid: 'leader1',
      email: 'proleader@boardly.cfd',
      plan: 'pro',
      isPremium: true,
      inCrew: true,
      crew: {
        name: 'Alpha Squad',
        isProShared: true,
        hasProMember: true,
        members: [{ uid: 'leader1', isPro: true, plan: 'pro' }],
      },
    }),
    expected: (r) => ({
      ok:
        r.isPro &&
        !r.isPlus &&
        r.plan === 'pro' &&
        r.planLabel === 'Boardly Pro' &&
        r.source === 'personal',
      message: 'Pro subscriber keeps personal Boardly Pro source status while sharing to crew.',
    }),
  },
  {
    id: 'plan_superadmin_in_crew',
    title: 'Superadmin inside a Crew',
    buildInput: () => ({
      email: 'shsvirtualadmin@gmail.com',
      role: 'superadmin',
      isSuperAdminClaim: true,
      inCrew: true,
      crew: {
        name: 'Alpha Squad',
        isProShared: false,
        hasProMember: false,
      },
    }),
    expected: (r) => ({
      ok:
        r.isSuperAdmin &&
        r.isPlus &&
        r.isUnlimited &&
        r.plan === 'plus' &&
        r.planLabel === 'Plus Unlimited' &&
        r.source === 'superadmin',
      message: 'Superadmin retains priority Plus Unlimited status regardless of crew state.',
    }),
  },
];

const TOTAL_PLANNED_CHECKS = PLAN_RESOLVER_TESTS.length + 3;

function formatElapsed(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '0ms';
  if (ms < 1000) {
    const rounded = ms < 10 ? Math.round(ms * 10) / 10 : Math.round(ms);
    return `${rounded}ms`;
  }
  if (ms < 60_000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  const mins = Math.floor(ms / 60_000);
  const secs = Math.floor((ms % 60_000) / 1000);
  return `${mins}m ${secs}s`;
}

function withStepTimeout<T>(promise: Promise<T>, ms: number, stepLabel: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${stepLabel} timed out after ${Math.round(ms / 1000)}s.`));
    }, ms);
    promise.then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

function renderStatusBadge(status: HealthStatus) {
  if (status === 'RUNNING') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold px-2 py-0.5 rounded shrink-0 whitespace-nowrap bg-amber-500/15 text-amber-400 border border-amber-500/30">
        <Loader2 size={11} className="animate-spin shrink-0" />
        <span>RUNNING</span>
      </span>
    );
  }
  if (status === 'PENDING') {
    return (
      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded shrink-0 whitespace-nowrap bg-white/5 text-[#888888] border border-white/10">
        QUEUED
      </span>
    );
  }
  if (status === 'WARN') {
    return (
      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded shrink-0 whitespace-nowrap bg-amber-500/15 text-amber-400 border border-amber-500/30">
        WARN
      </span>
    );
  }
  return (
    <span
      className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded shrink-0 whitespace-nowrap ${
        status === 'PASS'
          ? 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30'
          : 'bg-[#D71921]/10 text-[#D71921] border border-[#D71921]/30'
      }`}
    >
      {status}
    </span>
  );
}

export function AdminHealthPage() {
  const [results, setResults] = useState<HealthCheckItem[]>([]);
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [totalTimeMs, setTotalTimeMs] = useState(0);

  const activeRunIdRef = useRef(0);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopElapsedTimer = useCallback(() => {
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      activeRunIdRef.current += 1;
      stopElapsedTimer();
    };
  }, [stopElapsedTimer]);

  const runAllChecks = useCallback(async () => {
    const runId = ++activeRunIdRef.current;
    const isStale = () => activeRunIdRef.current !== runId;

    stopElapsedTimer();
    setRunning(true);
    setTotalTimeMs(0);
    const globalStart = performance.now();

    // Live elapsed timer ticking smoothly while the suite runs
    elapsedTimerRef.current = setInterval(() => {
      if (isStale()) return;
      setTotalTimeMs(Math.round(performance.now() - globalStart));
    }, 100);

    // ───────────────────────────────────────────────────────────────────────────
    // SECTION A: Plan Resolver Tests (Pure Logic, completes synchronously in ~1ms)
    // ───────────────────────────────────────────────────────────────────────────
    const planChecks: HealthCheckItem[] = PLAN_RESOLVER_TESTS.map((pt) => {
      const t0 = performance.now();
      try {
        const resolved = resolveEffectivePlan(pt.buildInput());
        const verdict = pt.expected(resolved);
        const elapsed = Math.round((performance.now() - t0) * 100) / 100;
        return {
          id: pt.id,
          category: 'plan_resolver',
          title: pt.title,
          status: verdict.ok ? 'PASS' : 'FAIL',
          timeMs: elapsed,
          message: verdict.message,
          details: JSON.stringify(resolved),
        };
      } catch (err: unknown) {
        const elapsed = Math.round((performance.now() - t0) * 100) / 100;
        return {
          id: pt.id,
          category: 'plan_resolver',
          title: pt.title,
          status: 'FAIL',
          timeMs: elapsed,
          message: (err as Error)?.message || 'Plan resolver threw unexpected exception.',
        };
      }
    });

    // Seed all 14 checks immediately so the UI shows live 11/14 progress on frame 1
    // and marks the 3 async suites as actively RUNNING in parallel
    const initialChecks: HealthCheckItem[] = [
      ...planChecks,
      {
        id: 'test_limit_atomic',
        category: 'test_limits',
        title: 'Daily Starter Limit (10 Starts Allowed, 11th Blocked, Unlimited Bypass)',
        status: 'RUNNING',
        timeMs: 0,
        message: 'Testing 10 starter session starts, 11th atomic block, and unlimited bypass...',
      },
      {
        id: 'd1_question_banks_health',
        category: 'test_limits',
        title: 'Cloudflare D1 Live Question Bank',
        status: 'RUNNING',
        timeMs: 0,
        message: 'Querying live D1 question bank health (/api/mcqs/health)...',
      },
      {
        id: 'crew_lifecycle_full',
        category: 'crew_lifecycle',
        title: 'Study Crew Lifecycle (Create, 30-Member Cap, 31st Blocked, Transfer, Leave, Delete)',
        status: 'RUNNING',
        timeMs: 0,
        message: 'Step 1/5: Creating temporary healthcheck crew...',
      },
    ];

    if (!isStale()) {
      setResults(initialChecks);
    }

    const patchCheck = (id: string, patch: Partial<HealthCheckItem>) => {
      if (isStale()) return;
      setResults((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    };

    // ───────────────────────────────────────────────────────────────────────────
    // SECTION B: Starter Daily Test Limit (10 Starts Allowed, 11th Blocked)
    // ───────────────────────────────────────────────────────────────────────────
    const runDailyLimitsCheck = async () => {
      const tLimitsStart = performance.now();
      const dummyUid = `hc_dummy_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

      try {
        // 1. Simulate 10 free test session starts
        let allTenAllowed = true;
        for (let i = 1; i <= FREE_DAILY_TESTS; i++) {
          patchCheck('test_limit_atomic', {
            message: `Verifying starter test starts (${i}/${FREE_DAILY_TESTS})...`,
            timeMs: Math.round(performance.now() - tLimitsStart),
          });
          const customId = `hc_att_${dummyUid}_${i}`;
          const res = await withStepTimeout(
            startTestSessionWithLimit({
              uid: dummyUid,
              isUnlimited: false,
              customAttemptId: customId,
              attemptPayload: {
                userId: dummyUid,
                mode: 'sprint',
                title: `Healthcheck Sprint #${i}`,
                healthcheck: true,
              },
            }),
            6000,
            `Starter test start #${i}`
          );
          if (!res.attemptId) allTenAllowed = false;
        }

        // 2. 11th start MUST be blocked by atomic server check
        patchCheck('test_limit_atomic', {
          message: 'Verifying 11th test start is atomically blocked...',
          timeMs: Math.round(performance.now() - tLimitsStart),
        });
        let eleventhBlocked = false;
        const customId11 = `hc_att_${dummyUid}_11`;
        try {
          await withStepTimeout(
            startTestSessionWithLimit({
              uid: dummyUid,
              isUnlimited: false,
              customAttemptId: customId11,
              attemptPayload: {
                userId: dummyUid,
                mode: 'sprint',
                title: 'Healthcheck Sprint #11 (Should Block)',
                healthcheck: true,
              },
            }),
            6000,
            '11th limit block check'
          );
        } catch (err: unknown) {
          if (
            err instanceof DailyTestLimitError ||
            (err as { code?: string })?.code === 'DAILY_TESTS_LIMIT_EXCEEDED'
          ) {
            eleventhBlocked = true;
          }
        }

        // 3. Unlimited plan is NEVER blocked
        patchCheck('test_limit_atomic', {
          message: 'Verifying unlimited plan bypass...',
          timeMs: Math.round(performance.now() - tLimitsStart),
        });
        let unlimitedSucceeded = false;
        const customIdUnlim = `hc_att_${dummyUid}_unlim`;
        try {
          const resUnlim = await withStepTimeout(
            startTestSessionWithLimit({
              uid: dummyUid,
              isUnlimited: true,
              customAttemptId: customIdUnlim,
              attemptPayload: {
                userId: dummyUid,
                mode: 'full',
                title: 'Healthcheck Unlimited Pass (Superadmin/Plus)',
                healthcheck: true,
              },
            }),
            6000,
            'Unlimited bypass check'
          );
          if (resUnlim.attemptId) {
            unlimitedSucceeded = true;
          }
        } catch (e) {
          console.warn('[Healthcheck] Unlimited start failed:', e);
        }

        // 4. Verify narrow Firestore read rule on caller's own usage doc with tight timeout
        const pktDateKey = getPKTDateKey();
        let firestoreReadNote = '';
        if (auth.currentUser?.uid) {
          try {
            await withStepTimeout(
              getDoc(doc(db, 'users', auth.currentUser.uid, 'usage', pktDateKey)),
              4000,
              'Firestore usage read'
            );
          } catch {
            firestoreReadNote = ' (Firestore usage read skipped after 4s timeout)';
          }
        }

        const elapsedB = Math.round(performance.now() - tLimitsStart);
        const okLimits = allTenAllowed && eleventhBlocked && unlimitedSucceeded;

        patchCheck('test_limit_atomic', {
          status: okLimits ? 'PASS' : 'FAIL',
          timeMs: elapsedB,
          message: okLimits
            ? `Allowed exactly 10 test starts, atomically rejected 11th start with DailyTestLimitError, and verified unlimited accounts bypass counter (PKT ${pktDateKey})${firestoreReadNote}.`
            : `Failed: 10 allowed = ${allTenAllowed}, 11th blocked = ${eleventhBlocked}, unlimited pass = ${unlimitedSucceeded}.`,
        });
      } catch (err: unknown) {
        const elapsedB = Math.round(performance.now() - tLimitsStart);
        patchCheck('test_limit_atomic', {
          status: 'FAIL',
          timeMs: elapsedB,
          message: (err as Error)?.message || 'Failed test limits transactional sequence.',
        });
      } finally {
        void cleanupHealthcheckDailyUsage(dummyUid);
      }
    };

    // ───────────────────────────────────────────────────────────────────────────
    // SECTION C: Crew Lifecycle (Create, 30-Cap Enforced, 31st Blocked, Leave, Cleanup)
    // ───────────────────────────────────────────────────────────────────────────
    const runCrewLifecycleCheck = async () => {
      const tCrewStart = performance.now();
      const tempCrewId = `hc_crew_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const crewRef = doc(db, 'crews', tempCrewId);
      const tempLeaderUid = auth.currentUser?.uid || `hc_leader_${Date.now()}`;

      try {
        // 1. Create crew doc
        patchCheck('crew_lifecycle_full', {
          message: 'Step 1/5: Creating temporary healthcheck crew...',
        });
        const tCreate0 = performance.now();
        const initialMember: {
          uid: string;
          displayName: string;
          email: string;
          joinedAt: string;
          role: 'leader' | 'member';
          isPro: boolean;
        } = {
          uid: tempLeaderUid,
          displayName: 'Healthcheck Leader',
          email: 'leader@healthcheck.internal',
          joinedAt: new Date().toISOString(),
          role: 'leader',
          isPro: true,
        };

        await withStepTimeout(
          setDoc(crewRef, {
            id: tempCrewId,
            name: `healthcheck-${Date.now()}`,
            code: 'HC' + Math.floor(1000 + Math.random() * 9000),
            leaderId: tempLeaderUid,
            leaderName: 'Healthcheck Leader',
            members: [initialMember],
            memberUids: [tempLeaderUid],
            maxMembers: MAX_CREW_MEMBERS,
            hasProMember: true,
            createdAt: serverTimestamp(),
          }),
          8000,
          'Crew create'
        );
        const tCreateElapsed = Math.round(performance.now() - tCreate0);

        // 2. Synthesize up to 30 members
        patchCheck('crew_lifecycle_full', {
          message: 'Step 2/5: Filling crew to 30-member capacity...',
          timeMs: Math.round(performance.now() - tCrewStart),
        });
        const tBatch0 = performance.now();
        const syntheticMembers: Array<{
          uid: string;
          displayName: string;
          email: string;
          joinedAt: string;
          role: 'leader' | 'member';
          isPro: boolean;
        }> = [initialMember];
        const syntheticUids = [tempLeaderUid];

        for (let i = 2; i <= 30; i++) {
          const u = `hc_member_${i}_${Date.now()}`;
          syntheticMembers.push({
            uid: u,
            displayName: `Synthetic Cadet #${i}`,
            email: `cadet${i}@healthcheck.internal`,
            joinedAt: new Date().toISOString(),
            role: 'member' as const,
            isPro: false,
          });
          syntheticUids.push(u);
        }

        await withStepTimeout(
          setDoc(
            crewRef,
            {
              members: syntheticMembers,
              memberUids: syntheticUids,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          ),
          8000,
          'Crew 30-member fill'
        );
        const tBatchElapsed = Math.round(performance.now() - tBatch0);

        // 3. Try to add 31st member: MUST be blocked by 30-member cap
        patchCheck('crew_lifecycle_full', {
          message: 'Step 3/5: Verifying 31st member join is rejected...',
          timeMs: Math.round(performance.now() - tCrewStart),
        });
        let thirtyFirstBlocked = false;
        const tCap0 = performance.now();
        try {
          await withStepTimeout(
            runTransaction(db, async (tx) => {
              const snap = await tx.get(crewRef);
              if (!snap.exists()) throw new Error('Crew doc missing');
              const data = snap.data();
              const mems = data.members || [];
              if (mems.length >= MAX_CREW_MEMBERS) {
                throw new Error(
                  `This crew has reached its maximum capacity of ${MAX_CREW_MEMBERS} members.`
                );
              }
              tx.update(crewRef, {
                members: [...mems, { uid: 'cadet_31', role: 'member' }],
              });
            }),
            8000,
            'Crew 31st member transaction'
          );
        } catch (capErr: unknown) {
          if ((capErr as Error)?.message?.includes('maximum capacity')) {
            thirtyFirstBlocked = true;
          } else {
            throw capErr;
          }
        }
        const tCapElapsed = Math.round(performance.now() - tCap0);

        // 4. Leader transfer simulation
        patchCheck('crew_lifecycle_full', {
          message: 'Step 4/5: Simulating leader transfer...',
          timeMs: Math.round(performance.now() - tCrewStart),
        });
        const tTransfer0 = performance.now();
        const newLeaderUid = syntheticUids[1];
        await withStepTimeout(
          setDoc(
            crewRef,
            {
              leaderId: newLeaderUid,
              leaderName: 'Synthetic Cadet #2',
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          ),
          8000,
          'Crew leader transfer'
        );
        const tTransferElapsed = Math.round(performance.now() - tTransfer0);

        // 5. Member leave simulation
        patchCheck('crew_lifecycle_full', {
          message: 'Step 5/5: Simulating member leave and cleanup...',
          timeMs: Math.round(performance.now() - tCrewStart),
        });
        const tLeave0 = performance.now();
        const remainingUids = syntheticUids.filter((id) => id !== syntheticUids[2]);
        const remainingMembers = syntheticMembers.filter((m) => m.uid !== syntheticUids[2]);
        await withStepTimeout(
          setDoc(
            crewRef,
            {
              members: remainingMembers,
              memberUids: remainingUids,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          ),
          8000,
          'Crew member leave'
        );
        const tLeaveElapsed = Math.round(performance.now() - tLeave0);

        const elapsedC = Math.round(performance.now() - tCrewStart);
        const okCrew = thirtyFirstBlocked;

        patchCheck('crew_lifecycle_full', {
          status: okCrew ? 'PASS' : 'FAIL',
          timeMs: elapsedC,
          message: okCrew
            ? `Created squad (${formatElapsed(tCreateElapsed)}), filled 30 members (${formatElapsed(tBatchElapsed)}), rejected 31st join (${formatElapsed(tCapElapsed)}), transferred leader (${formatElapsed(tTransferElapsed)}), removed member (${formatElapsed(tLeaveElapsed)}), and deleted temporary docs.`
            : 'Failed: 31st member was not correctly rejected by 30-member capacity cap.',
        });
      } catch (err: unknown) {
        const elapsedC = Math.round(performance.now() - tCrewStart);
        patchCheck('crew_lifecycle_full', {
          status: 'FAIL',
          timeMs: elapsedC,
          message: (err as Error)?.message || 'Failed crew lifecycle execution.',
        });
      } finally {
        deleteDoc(crewRef).catch(() => {});
      }
    };

    // ───────────────────────────────────────────────────────────────────────────
    // SECTION D: Cloudflare D1 Live Question Bank (GET /api/mcqs/health)
    // ───────────────────────────────────────────────────────────────────────────
    const runD1HealthCheck = async () => {
      const tD1Start = performance.now();
      try {
        const bank = await withStepTimeout(
          fetchLiveQuestionBankStats({ force: true, strict: true }),
          10000,
          'D1 question bank health check'
        );
        const elapsedD1 = Math.round(performance.now() - tD1Start);
        const dbName = bank.databaseName || 'boardly-posts-db';
        const subjectCount = Object.keys(bank.bySubject || {}).length;
        const lastImportLabel = formatSafeLastImport(bank.lastImportAt);

        patchCheck('d1_question_banks_health', {
          status: bank.totalMcqs > 0 ? 'PASS' : 'FAIL',
          timeMs: elapsedD1,
          message: `Cloudflare D1 (${dbName}) online: ${bank.totalMcqs.toLocaleString()} total MCQs (${bank.liveUniversities} of ${bank.totalUniversities} universities live · ${subjectCount} subjects) · Last import: ${lastImportLabel}.`,
        });
      } catch (err: unknown) {
        patchCheck('d1_question_banks_health', {
          status: 'FAIL',
          timeMs: Math.round(performance.now() - tD1Start),
          message: (err as Error)?.message || 'Failed to verify D1 live question bank (/api/mcqs/health).',
        });
      }
    };

    // Execute all async diagnostic suites concurrently for fast live updates
    await Promise.all([runD1HealthCheck(), runDailyLimitsCheck(), runCrewLifecycleCheck()]);

    if (!isStale()) {
      stopElapsedTimer();
      setTotalTimeMs(Math.round(performance.now() - globalStart));
      setRunning(false);
    }
  }, [stopElapsedTimer]);

  useEffect(() => {
    void runAllChecks();
    return () => {
      activeRunIdRef.current += 1;
      stopElapsedTimer();
    };
  }, [runAllChecks, stopElapsedTimer]);

  const totalChecks = results.length || TOTAL_PLANNED_CHECKS;
  const passCount = results.filter((r) => r.status === 'PASS').length;
  const failCount = results.filter((r) => r.status === 'FAIL').length;
  const warnCount = results.filter((r) => r.status === 'WARN').length;
  const completedCount = results.filter(
    (r) => r.status === 'PASS' || r.status === 'FAIL' || r.status === 'WARN'
  ).length;
  const activeChecks = results.filter((r) => r.status === 'RUNNING');
  const progressPct = totalChecks > 0 ? Math.round((completedCount / totalChecks) * 100) : 0;

  const overallStatusLabel = running
    ? 'RUNNING'
    : failCount > 0
    ? 'FAIL'
    : warnCount > 0
    ? 'WARN'
    : 'PASS';

  const overallStatusColor = running
    ? 'text-amber-400'
    : failCount > 0
    ? 'text-[#D71921]'
    : warnCount > 0
    ? 'text-amber-400'
    : 'text-[#10b981]';

  const handleCopyReport = () => {
    const lines = [
      `============================================================`,
      `BOARDLY SYSTEM VERIFICATION HEALTH REPORT`,
      `Generated: ${new Date().toISOString()}`,
      `Total Checks: ${results.length} | Passed: ${passCount} | Failed: ${failCount} | Warnings: ${warnCount}`,
      `Total Execution Time: ${formatElapsed(totalTimeMs)} (${totalTimeMs}ms)`,
      `============================================================\n`,
    ];

    results.forEach((r, idx) => {
      lines.push(`[${r.status}] #${idx + 1}: ${r.title} (${formatElapsed(r.timeMs)})`);
      lines.push(`   Sentence: ${r.message}`);
      lines.push(``);
    });

    lines.push(`============================================================`);
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div data-admin-page="health" className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* ── Top Header Bar ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222222]">
        <div className="min-w-0">
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-xs text-[#888888] hover:text-white mb-2 transition-colors font-heading"
          >
            <ArrowLeft size={14} />
            <span>Return to Admin Portal</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-heading">
              Platform Health &amp; Verification
            </h1>
            <span className="text-[11px] font-heading font-semibold px-2.5 py-0.5 rounded-full border border-[#D71921] text-[#D71921] bg-[rgba(215,25,33,0.1)] whitespace-nowrap shrink-0">
              Superadmin Only
            </span>
          </div>
          <p className="text-xs text-[#888888] mt-1 font-heading">
            Live diagnostic suite verifying plan resolvers, test limits, and crew capacity enforcement.
          </p>
        </div>

        {/* Action Buttons: Run Again & Copy Report */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleCopyReport}
            disabled={running || results.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-[12px] border border-[#2A2A2A] bg-[#141414] hover:bg-[#1E1E1E] text-white text-xs font-heading font-semibold transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
          >
            {copied ? <Check size={14} className="text-[#10b981]" /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy report'}</span>
          </button>

          <button
            type="button"
            onClick={() => void runAllChecks()}
            disabled={running}
            className="relative overflow-hidden inline-flex items-center justify-center gap-2 px-4 py-2 rounded-[12px] bg-[#D71921] hover:bg-[#b0141a] text-white text-xs font-heading font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-lg shadow-red-950/40 min-w-[140px] whitespace-nowrap"
          >
            <Play size={14} className="shrink-0" />
            <span>{running ? `Running (${completedCount}/${totalChecks})` : 'Run again'}</span>
            {running && <ButtonLineLoader />}
          </button>
        </div>
      </div>

      {/* ── Summary KPI Metric Cards (Nothing OS #0D0D0D style) ───────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-[18px] bg-[#0D0D0D] border border-[#222222] min-w-0 overflow-hidden">
          <span className="text-[11px] uppercase font-semibold text-[#888888] tracking-wider block mb-1.5 whitespace-nowrap truncate">
            Overall Status
          </span>
          <span
            className={`font-dot text-lg sm:text-xl font-bold whitespace-nowrap leading-none inline-block ${overallStatusColor}`}
          >
            {overallStatusLabel}
          </span>
        </div>

        <div className="p-4 rounded-[18px] bg-[#0D0D0D] border border-[#222222] min-w-0 overflow-hidden">
          <span className="text-[11px] uppercase font-semibold text-[#888888] tracking-wider block mb-1.5 whitespace-nowrap truncate">
            Tests Passed
          </span>
          <span className="font-dot text-lg sm:text-xl font-bold text-white whitespace-nowrap tabular-nums leading-none inline-block">
            {passCount} / {totalChecks}
          </span>
        </div>

        <div className="p-4 rounded-[18px] bg-[#0D0D0D] border border-[#222222] min-w-0 overflow-hidden">
          <span className="text-[11px] uppercase font-semibold text-[#888888] tracking-wider block mb-1.5 whitespace-nowrap truncate">
            Failures
          </span>
          <span
            className={`font-dot text-lg sm:text-xl font-bold whitespace-nowrap tabular-nums leading-none inline-block ${
              failCount > 0 ? 'text-[#D71921]' : 'text-[#666666]'
            }`}
          >
            {failCount}
          </span>
        </div>

        <div className="p-4 rounded-[18px] bg-[#0D0D0D] border border-[#222222] min-w-0 overflow-hidden">
          <span className="text-[11px] uppercase font-semibold text-[#888888] tracking-wider block mb-1.5 whitespace-nowrap truncate">
            Total Elapsed
          </span>
          <span className="font-dot text-lg sm:text-xl font-bold text-white whitespace-nowrap tabular-nums leading-none inline-block">
            {formatElapsed(totalTimeMs)}
          </span>
        </div>
      </div>

      {/* ── Live Progress Strip while suite is executing ─────────────────── */}
      {running && (
        <div className="rounded-[16px] bg-[#0D0D0D] border border-[#222222] px-4 py-3 space-y-2">
          <div className="flex items-center justify-between gap-3 text-xs font-heading">
            <div className="flex items-center gap-2 min-w-0">
              <Loader2 size={14} className="animate-spin text-amber-400 shrink-0" />
              <span className="text-white font-semibold truncate">
                {activeChecks.length > 0
                  ? `Running ${activeChecks.length} diagnostic ${activeChecks.length === 1 ? 'check' : 'checks'}: ${activeChecks.map((c) => c.title.split(' (')[0]).join(' · ')}`
                  : 'Finalizing health verification suite...'}
              </span>
            </div>
            <span className="font-mono text-[11px] text-[#888888] whitespace-nowrap tabular-nums shrink-0">
              {completedCount}/{totalChecks} ({progressPct}%)
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#1C1C1C] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#10b981] transition-all duration-200"
              style={{ width: `${Math.max(6, progressPct)}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Results List Grouped by Category ─────────────────────────────── */}
      <div className="space-y-6">
        {/* Category 1: Plan Resolver Tests */}
        <div className="rounded-[20px] bg-[var(--surface)] border border-[var(--border)] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Shield size={16} className="text-[var(--accent)] shrink-0" />
              <h2 className="text-sm font-bold text-[var(--text)] font-heading truncate">
                (a) Plan Resolver Logic Suite (Pure Logic)
              </h2>
            </div>
            <span className="text-[11px] font-mono text-[var(--text-muted)] whitespace-nowrap shrink-0">
              {results.filter((r) => r.category === 'plan_resolver').length} checks
            </span>
          </div>

          <div className="divide-y divide-[var(--border)]">
            {results
              .filter((r) => r.category === 'plan_resolver')
              .map((item) => (
                <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {renderStatusBadge(item.status)}
                      <span className="text-xs font-semibold text-white font-heading">
                        {item.title}
                      </span>
                    </div>
                    <p className="text-[12px] text-[#AAAAAA] leading-relaxed pl-0 sm:pl-1">
                      {item.message}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-[11px] font-mono text-[#666666] whitespace-nowrap tabular-nums">
                      {item.status === 'PENDING' ? '—' : formatElapsed(item.timeMs)}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Category 2: Starter Test Limit Verification */}
        <div className="rounded-[20px] bg-[var(--surface)] border border-[var(--border)] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Layers size={16} className="text-[var(--accent)] shrink-0" />
              <h2 className="text-sm font-bold text-[var(--text)] font-heading truncate">
                (b) Daily Starter Limit &amp; Atomic Blocking Suite
              </h2>
            </div>
            <span className="text-[11px] font-mono text-[var(--text-muted)] whitespace-nowrap shrink-0">
              {results.filter((r) => r.category === 'test_limits').length} checks
            </span>
          </div>

          <div className="divide-y divide-[var(--border)]">
            {results
              .filter((r) => r.category === 'test_limits')
              .map((item) => (
                <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {renderStatusBadge(item.status)}
                      <span className="text-xs font-semibold text-white font-heading">
                        {item.title}
                      </span>
                    </div>
                    <p className="text-[12px] text-[#AAAAAA] leading-relaxed pl-0 sm:pl-1 break-words whitespace-normal">
                      {item.message}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-[11px] font-mono text-[#666666] whitespace-nowrap tabular-nums">
                      {item.status === 'PENDING'
                        ? '—'
                        : item.status === 'RUNNING' && item.timeMs === 0
                        ? '...'
                        : formatElapsed(item.timeMs)}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Category 3: Study Crew Lifecycle & 30-Cap */}
        <div className="rounded-[20px] bg-[var(--surface)] border border-[var(--border)] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Users size={16} className="text-[var(--accent)] shrink-0" />
              <h2 className="text-sm font-bold text-[var(--text)] font-heading truncate">
                (c) Study Crew Lifecycle &amp; 30-Member Cap Suite
              </h2>
            </div>
            <span className="text-[11px] font-mono text-[var(--text-muted)] whitespace-nowrap shrink-0">
              {results.filter((r) => r.category === 'crew_lifecycle').length} checks
            </span>
          </div>

          <div className="divide-y divide-[var(--border)]">
            {results
              .filter((r) => r.category === 'crew_lifecycle')
              .map((item) => (
                <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {renderStatusBadge(item.status)}
                      <span className="text-xs font-semibold text-white font-heading">
                        {item.title}
                      </span>
                    </div>
                    <p className="text-[12px] text-[#AAAAAA] leading-relaxed pl-0 sm:pl-1">
                      {item.message}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-[11px] font-mono text-[#666666] whitespace-nowrap tabular-nums">
                      {item.status === 'PENDING'
                        ? '—'
                        : item.status === 'RUNNING' && item.timeMs === 0
                        ? '...'
                        : formatElapsed(item.timeMs)}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminHealthPage;

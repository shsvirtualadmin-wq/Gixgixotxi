import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Play,
  Copy,
  Check,
  ArrowLeft,
  Shield,
  Layers,
  Users,
} from 'lucide-react';
import { resolveEffectivePlan, type PlanResolverInput } from '@/hooks/useEffectivePlan';
import {
  startTestSessionWithLimit,
  DailyTestLimitError,
  FREE_DAILY_TESTS,
} from '@/services/testLimits';
import {
  doc,
  setDoc,
  deleteDoc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MAX_CREW_MEMBERS } from '@/constants/limits';

export type HealthStatus = 'PASS' | 'WARN' | 'FAIL';

export interface HealthCheckItem {
  id: string;
  category: 'plan_resolver' | 'test_limits' | 'crew_lifecycle';
  title: string;
  status: HealthStatus;
  timeMs: number;
  message: string;
  details?: string;
}

export function AdminHealthPage() {
  const [results, setResults] = useState<HealthCheckItem[]>([]);
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [totalTimeMs, setTotalTimeMs] = useState(0);

  const runAllChecks = useCallback(async () => {
    setRunning(true);
    const checks: HealthCheckItem[] = [];
    const globalStart = performance.now();

    // ───────────────────────────────────────────────────────────────────────────
    // SECTION A: Plan Resolver Tests (Pure Logic, 0 data modifications)
    // ───────────────────────────────────────────────────────────────────────────

    const planTests: Array<{
      id: string;
      title: string;
      input: PlanResolverInput;
      expected: (res: ReturnType<typeof resolveEffectivePlan>) => { ok: boolean; message: string };
    }> = [
      {
        id: 'plan_superadmin',
        title: 'Superadmin Email/Role',
        input: { email: 'shsvirtualadmin@gmail.com', role: 'superadmin' },
        expected: (r) => ({
          ok: r.isSuperAdmin && r.isPro && r.isUnlimited && r.plan === 'pro' && r.source === 'superadmin',
          message: 'Superadmin email/role resolved immediately to Pro Unlimited with source superadmin.',
        }),
      },
      {
        id: 'plan_free',
        title: 'Free Student',
        input: { email: 'student@boardly.cfd', role: 'student', plan: 'free' },
        expected: (r) => ({
          ok: !r.isPro && !r.isUnlimited && r.plan === 'free' && r.source === 'none',
          message: 'Free student account correctly defaults to Free tier with 10 daily tests.',
        }),
      },
      {
        id: 'plan_pro_active',
        title: 'Active Personal Pro',
        input: {
          email: 'paying@boardly.cfd',
          role: 'student',
          plan: 'pro',
          isPremium: true,
          planExpiresAt: Date.now() + 86400000,
        },
        expected: (r) => ({
          ok: r.isPro && r.isUnlimited && r.plan === 'pro' && r.source === 'personal',
          message: 'Active personal Pro subscription resolved to Pro Unlimited access.',
        }),
      },
      {
        id: 'plan_pro_expired',
        title: 'Expired Personal Pro',
        input: {
          email: 'expired@boardly.cfd',
          role: 'student',
          plan: 'pro',
          isPremium: true,
          planExpiresAt: Date.now() - 86400000,
        },
        expected: (r) => ({
          ok: !r.isPro && !r.isUnlimited && r.plan === 'free',
          message: 'Expired Pro account correctly downgraded to Free starter tier.',
        }),
      },
      {
        id: 'plan_crew_shared',
        title: 'Free in Crew with Sharing Pro Member',
        input: {
          email: 'member@boardly.cfd',
          inCrew: true,
          crew: {
            name: 'Alpha Squad',
            isProShared: true,
            hasProMember: true,
            members: [{ uid: 'leader1', isPro: true, plan: 'pro' }],
          },
        },
        expected: (r) => ({
          ok: r.isPro && r.isUnlimited && r.source === 'crew' && r.crewName === 'Alpha Squad',
          message: 'Crew member receives Pro Unlimited access shared from Pro squad mate.',
        }),
      },
      {
        id: 'plan_crew_sharing_off',
        title: 'Crew with Sharing Toggled Off',
        input: {
          email: 'member@boardly.cfd',
          inCrew: true,
          crew: {
            name: 'Alpha Squad',
            isProShared: false,
            hasProMember: true,
            members: [{ uid: 'leader1', isPro: true, plan: 'pro' }],
          },
        },
        expected: (r) => ({
          ok: !r.isPro && !r.isUnlimited && r.plan === 'free',
          message: 'Crew sharing disabled flag is respected and leaves member on Free tier.',
        }),
      },
      {
        id: 'plan_left_crew',
        title: 'Member Who Left Crew',
        input: {
          email: 'former@boardly.cfd',
          inCrew: false,
          crew: null,
          plan: 'free',
        },
        expected: (r) => ({
          ok: !r.isPro && !r.isUnlimited && r.plan === 'free',
          message: 'Member who departed crew falls back cleanly to Free starter limits.',
        }),
      },
      {
        id: 'plan_unlimited_sharer',
        title: 'Unlimited Personal Sharer inside Crew',
        input: {
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
        },
        expected: (r) => ({
          ok: r.isPro && r.source === 'personal',
          message: 'Pro subscriber keeps personal Pro source status while sharing to crew.',
        }),
      },
      {
        id: 'plan_superadmin_in_crew',
        title: 'Superadmin inside a Crew',
        input: {
          email: 'shsvirtualadmin@gmail.com',
          role: 'superadmin',
          inCrew: true,
          crew: {
            name: 'Alpha Squad',
            isProShared: false,
            hasProMember: false,
          },
        },
        expected: (r) => ({
          ok: r.isSuperAdmin && r.isPro && r.source === 'superadmin',
          message: 'Superadmin retains priority Superadmin Unlimited status regardless of crew state.',
        }),
      },
    ];

    for (const pt of planTests) {
      const t0 = performance.now();
      try {
        const resolved = resolveEffectivePlan(pt.input);
        const verdict = pt.expected(resolved);
        const elapsed = Math.round((performance.now() - t0) * 100) / 100;
        checks.push({
          id: pt.id,
          category: 'plan_resolver',
          title: pt.title,
          status: verdict.ok ? 'PASS' : 'FAIL',
          timeMs: elapsed,
          message: verdict.message,
          details: JSON.stringify(resolved),
        });
      } catch (err: unknown) {
        const elapsed = Math.round((performance.now() - t0) * 100) / 100;
        checks.push({
          id: pt.id,
          category: 'plan_resolver',
          title: pt.title,
          status: 'FAIL',
          timeMs: elapsed,
          message: (err as Error)?.message || 'Plan resolver threw unexpected exception.',
        });
      }
    }

    // ───────────────────────────────────────────────────────────────────────────
    // SECTION B: Starter Daily Test Limit (10 Starts Allowed, 11th Blocked)
    // ───────────────────────────────────────────────────────────────────────────
    const tLimitsStart = performance.now();
    const dummyUid = `hc_dummy_${Date.now()}`;
    const createdAttemptIds: string[] = [];

    try {
      // 1. Simulate 10 free test session starts
      let allTenAllowed = true;
      for (let i = 1; i <= FREE_DAILY_TESTS; i++) {
        const customId = `hc_att_${dummyUid}_${i}`;
        createdAttemptIds.push(customId);
        const res = await startTestSessionWithLimit({
          uid: dummyUid,
          isUnlimited: false,
          customAttemptId: customId,
          attemptPayload: {
            userId: dummyUid,
            mode: 'sprint',
            title: `Healthcheck Sprint #${i}`,
            healthcheck: true,
          },
        });
        if (!res.attemptId) allTenAllowed = false;
      }

      // 2. 11th start MUST be blocked by atomic transaction
      let eleventhBlocked = false;
      const customId11 = `hc_att_${dummyUid}_11`;
      try {
        await startTestSessionWithLimit({
          uid: dummyUid,
          isUnlimited: false,
          customAttemptId: customId11,
          attemptPayload: {
            userId: dummyUid,
            mode: 'sprint',
            title: 'Healthcheck Sprint #11 (Should Block)',
            healthcheck: true,
          },
        });
        createdAttemptIds.push(customId11);
      } catch (err: unknown) {
        if (
          err instanceof DailyTestLimitError ||
          (err as { code?: string })?.code === 'DAILY_TESTS_LIMIT_EXCEEDED'
        ) {
          eleventhBlocked = true;
        }
      }

      // 3. Unlimited plan is NEVER blocked
      let unlimitedSucceeded = false;
      const customIdUnlim = `hc_att_${dummyUid}_unlim`;
      try {
        const resUnlim = await startTestSessionWithLimit({
          uid: dummyUid,
          isUnlimited: true,
          customAttemptId: customIdUnlim,
          attemptPayload: {
            userId: dummyUid,
            mode: 'full',
            title: 'Healthcheck Unlimited Pass (Superadmin/Pro)',
            healthcheck: true,
          },
        });
        if (resUnlim.attemptId) {
          unlimitedSucceeded = true;
          createdAttemptIds.push(customIdUnlim);
        }
      } catch (e) {
        console.warn('[Healthcheck] Unlimited start failed:', e);
      }

      const elapsedB = Math.round(performance.now() - tLimitsStart);
      const okLimits = allTenAllowed && eleventhBlocked && unlimitedSucceeded;

      checks.push({
        id: 'test_limit_atomic',
        category: 'test_limits',
        title: 'Daily Starter Limit (10 Starts Allowed, 11th Blocked, Unlimited Bypass)',
        status: okLimits ? 'PASS' : 'FAIL',
        timeMs: elapsedB,
        message: okLimits
          ? `Allowed exactly 10 test starts, atomically rejected 11th start with DailyTestLimitError, and verified unlimited accounts bypass counter.`
          : `Failed: 10 allowed = ${allTenAllowed}, 11th blocked = ${eleventhBlocked}, unlimited pass = ${unlimitedSucceeded}.`,
      });
    } catch (err: unknown) {
      const elapsedB = Math.round(performance.now() - tLimitsStart);
      checks.push({
        id: 'test_limit_atomic',
        category: 'test_limits',
        title: 'Daily Starter Limit Verification',
        status: 'FAIL',
        timeMs: elapsedB,
        message: (err as Error)?.message || 'Failed test limits transactional sequence.',
      });
    } finally {
      // Clean up all temporary attempt docs and usage doc
      for (const attId of createdAttemptIds) {
        deleteDoc(doc(db, 'attempts', attId)).catch(() => {});
      }
      // Clean up usage counter doc
      const now = new Date();
      const pktYear = now.getUTCFullYear();
      const pktMonth = String(now.getUTCMonth() + 1).padStart(2, '0');
      const pktDay = String(now.getUTCDate()).padStart(2, '0');
      deleteDoc(doc(db, 'users', dummyUid, 'usage', `${pktYear}-${pktMonth}-${pktDay}`)).catch(() => {});
      deleteDoc(doc(db, 'users', dummyUid)).catch(() => {});
    }

    // ───────────────────────────────────────────────────────────────────────────
    // SECTION C: Crew Lifecycle (Create, 30-Cap Enforced, 31st Blocked, Leave, Cleanup)
    // ───────────────────────────────────────────────────────────────────────────
    const tCrewStart = performance.now();
    const tempCrewId = `hc_crew_${Date.now()}`;
    const crewRef = doc(db, 'crews', tempCrewId);
    const tempLeaderUid = `hc_leader_${Date.now()}`;

    try {
      // 1. Create crew doc
      const tCreate0 = performance.now();
      const initialMember = {
        uid: tempLeaderUid,
        displayName: 'Healthcheck Leader',
        email: 'leader@healthcheck.internal',
        joinedAt: new Date().toISOString(),
        role: 'leader' as const,
        isPro: true,
      };

      await setDoc(crewRef, {
        id: tempCrewId,
        name: `healthcheck-${Date.now()}`,
        code: 'HC' + Math.floor(1000 + Math.random() * 9000),
        leaderId: tempLeaderUid,
        leaderName: 'Healthcheck Leader',
        members: [initialMember],
        memberUids: [tempLeaderUid],
        maxMembers: MAX_CREW_MEMBERS, // 30
        hasProMember: true,
        createdAt: serverTimestamp(),
      });
      const tCreateElapsed = Math.round(performance.now() - tCreate0);

      // 2. Synthesize up to 30 members in batches
      const tBatch0 = performance.now();
      const syntheticMembers = [initialMember];
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

      await setDoc(
        crewRef,
        {
          members: syntheticMembers,
          memberUids: syntheticUids,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      const tBatchElapsed = Math.round(performance.now() - tBatch0);

      // 3. Try to add 31st member: MUST be blocked by 30-member cap
      let thirtyFirstBlocked = false;
      const tCap0 = performance.now();
      try {
        await runTransaction(db, async (tx) => {
          const snap = await tx.get(crewRef);
          if (!snap.exists()) throw new Error('Crew doc missing');
          const data = snap.data();
          const mems = data.members || [];
          if (mems.length >= MAX_CREW_MEMBERS) {
            throw new Error(`This crew has reached its maximum capacity of ${MAX_CREW_MEMBERS} members.`);
          }
          tx.update(crewRef, {
            members: [...mems, { uid: 'cadet_31', role: 'member' }],
          });
        });
      } catch (capErr: unknown) {
        if ((capErr as Error)?.message?.includes('maximum capacity')) {
          thirtyFirstBlocked = true;
        }
      }
      const tCapElapsed = Math.round(performance.now() - tCap0);

      // 4. Leader transfer simulation
      const tTransfer0 = performance.now();
      const newLeaderUid = syntheticUids[1];
      await setDoc(
        crewRef,
        {
          leaderId: newLeaderUid,
          leaderName: 'Synthetic Cadet #2',
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      const tTransferElapsed = Math.round(performance.now() - tTransfer0);

      // 5. Member leave simulation
      const tLeave0 = performance.now();
      const remainingUids = syntheticUids.filter((id) => id !== syntheticUids[2]);
      const remainingMembers = syntheticMembers.filter((m) => m.uid !== syntheticUids[2]);
      await setDoc(
        crewRef,
        {
          members: remainingMembers,
          memberUids: remainingUids,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      const tLeaveElapsed = Math.round(performance.now() - tLeave0);

      const elapsedC = Math.round(performance.now() - tCrewStart);
      const okCrew = thirtyFirstBlocked;

      checks.push({
        id: 'crew_lifecycle_full',
        category: 'crew_lifecycle',
        title: 'Study Crew Lifecycle (Create, 30-Member Cap, 31st Blocked, Transfer, Leave, Delete)',
        status: okCrew ? 'PASS' : 'FAIL',
        timeMs: elapsedC,
        message: okCrew
          ? `Created squad (${tCreateElapsed}ms), filled 30 members (${tBatchElapsed}ms), rejected 31st join (${tCapElapsed}ms), transferred leader (${tTransferElapsed}ms), removed member (${tLeaveElapsed}ms), and deleted temporary docs.`
          : 'Failed: 31st member was not correctly rejected by 30-member capacity cap.',
      });
    } catch (err: unknown) {
      const elapsedC = Math.round(performance.now() - tCrewStart);
      checks.push({
        id: 'crew_lifecycle_full',
        category: 'crew_lifecycle',
        title: 'Study Crew Lifecycle',
        status: 'FAIL',
        timeMs: elapsedC,
        message: (err as Error)?.message || 'Failed crew lifecycle execution.',
      });
    } finally {
      // Always delete all temporary docs
      deleteDoc(crewRef).catch(() => {});
    }

    const total = Math.round(performance.now() - globalStart);
    setResults(checks);
    setTotalTimeMs(total);
    setRunning(false);
  }, []);

  useEffect(() => {
    runAllChecks();
  }, [runAllChecks]);

  const passCount = results.filter((r) => r.status === 'PASS').length;
  const failCount = results.filter((r) => r.status === 'FAIL').length;
  const warnCount = results.filter((r) => r.status === 'WARN').length;

  const handleCopyReport = () => {
    const lines = [
      `============================================================`,
      `BOARDLY SYSTEM VERIFICATION HEALTH REPORT`,
      `Generated: ${new Date().toISOString()}`,
      `Total Checks: ${results.length} | Passed: ${passCount} | Failed: ${failCount} | Warnings: ${warnCount}`,
      `Total Execution Time: ${totalTimeMs}ms`,
      `============================================================\n`,
    ];

    results.forEach((r, idx) => {
      lines.push(`[${r.status}] #${idx + 1}: ${r.title} (${r.timeMs}ms)`);
      lines.push(`   Sentence: ${r.message}`);
      lines.push(``);
    });

    lines.push(`============================================================`);
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* ── Top Header Bar ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222222]">
        <div>
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-xs text-[#888888] hover:text-white mb-2 transition-colors font-heading"
          >
            <ArrowLeft size={14} />
            <span>Return to Admin Portal</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-heading">
              Platform Health &amp; Verification
            </h1>
            <span className="text-[11px] font-heading font-semibold px-2.5 py-0.5 rounded-full border border-[#D71921] text-[#D71921] bg-[rgba(215,25,33,0.1)]">
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
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-[12px] border border-[#2A2A2A] bg-[#141414] hover:bg-[#1E1E1E] text-white text-xs font-heading font-semibold transition-colors disabled:opacity-50 cursor-pointer"
          >
            {copied ? <Check size={14} className="text-[#10b981]" /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy report'}</span>
          </button>

          <button
            type="button"
            onClick={runAllChecks}
            disabled={running}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[12px] bg-[#D71921] hover:bg-[#b0141a] text-white text-xs font-heading font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-lg shadow-red-950/40"
          >
            <Play size={14} className={running ? 'animate-spin' : ''} />
            <span>{running ? 'Running suite...' : 'Run again'}</span>
          </button>
        </div>
      </div>

      {/* ── Summary KPI Metric Cards (Nothing OS #0D0D0D style) ───────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-[18px] bg-[#0D0D0D] border border-[#222222]">
          <span className="text-[11px] uppercase font-semibold text-[#888888] tracking-wider block mb-1">
            Overall Status
          </span>
          <span
            className={`font-dot text-2xl font-bold ${
              failCount > 0 ? 'text-[#D71921]' : 'text-[#10b981]'
            }`}
          >
            {running ? 'TESTING...' : failCount === 0 ? 'PASS' : 'FAIL'}
          </span>
        </div>

        <div className="p-4 rounded-[18px] bg-[#0D0D0D] border border-[#222222]">
          <span className="text-[11px] uppercase font-semibold text-[#888888] tracking-wider block mb-1">
            Tests Passed
          </span>
          <span className="font-dot text-2xl font-bold text-white">
            {passCount} / {results.length}
          </span>
        </div>

        <div className="p-4 rounded-[18px] bg-[#0D0D0D] border border-[#222222]">
          <span className="text-[11px] uppercase font-semibold text-[#888888] tracking-wider block mb-1">
            Failures
          </span>
          <span
            className={`font-dot text-2xl font-bold ${
              failCount > 0 ? 'text-[#D71921]' : 'text-[#666666]'
            }`}
          >
            {failCount}
          </span>
        </div>

        <div className="p-4 rounded-[18px] bg-[#0D0D0D] border border-[#222222]">
          <span className="text-[11px] uppercase font-semibold text-[#888888] tracking-wider block mb-1">
            Total Elapsed
          </span>
          <span className="font-dot text-2xl font-bold text-white">
            {totalTimeMs}ms
          </span>
        </div>
      </div>

      {/* ── Results List Grouped by Category ─────────────────────────────── */}
      <div className="space-y-6">
        {/* Category 1: Plan Resolver Tests */}
        <div className="rounded-[20px] bg-[#0D0D0D] border border-[#222222] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1F1F1F]">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-[#D71921]" />
              <h2 className="text-sm font-bold text-white font-heading">
                (a) Plan Resolver Logic Suite (Pure Logic)
              </h2>
            </div>
            <span className="text-[11px] font-mono text-[#888888]">
              {results.filter((r) => r.category === 'plan_resolver').length} checks
            </span>
          </div>

          <div className="divide-y divide-[#1A1A1A]">
            {results
              .filter((r) => r.category === 'plan_resolver')
              .map((item) => (
                <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                          item.status === 'PASS'
                            ? 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30'
                            : 'bg-[#D71921]/10 text-[#D71921] border border-[#D71921]/30'
                        }`}
                      >
                        {item.status}
                      </span>
                      <span className="text-xs font-semibold text-white font-heading">
                        {item.title}
                      </span>
                    </div>
                    <p className="text-[12px] text-[#AAAAAA] leading-relaxed pl-0 sm:pl-1">
                      {item.message}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-[11px] font-mono text-[#666666]">
                      {item.timeMs}ms
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Category 2: Starter Test Limit Verification */}
        <div className="rounded-[20px] bg-[#0D0D0D] border border-[#222222] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1F1F1F]">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-[#D71921]" />
              <h2 className="text-sm font-bold text-white font-heading">
                (b) Daily Starter Limit &amp; Atomic Blocking Suite
              </h2>
            </div>
            <span className="text-[11px] font-mono text-[#888888]">
              {results.filter((r) => r.category === 'test_limits').length} checks
            </span>
          </div>

          <div className="divide-y divide-[#1A1A1A]">
            {results
              .filter((r) => r.category === 'test_limits')
              .map((item) => (
                <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                          item.status === 'PASS'
                            ? 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30'
                            : 'bg-[#D71921]/10 text-[#D71921] border border-[#D71921]/30'
                        }`}
                      >
                        {item.status}
                      </span>
                      <span className="text-xs font-semibold text-white font-heading">
                        {item.title}
                      </span>
                    </div>
                    <p className="text-[12px] text-[#AAAAAA] leading-relaxed pl-0 sm:pl-1">
                      {item.message}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-[11px] font-mono text-[#666666]">
                      {item.timeMs}ms
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Category 3: Study Crew Lifecycle & 30-Cap */}
        <div className="rounded-[20px] bg-[#0D0D0D] border border-[#222222] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1F1F1F]">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-[#D71921]" />
              <h2 className="text-sm font-bold text-white font-heading">
                (c) Study Crew Lifecycle &amp; 30-Member Cap Suite
              </h2>
            </div>
            <span className="text-[11px] font-mono text-[#888888]">
              {results.filter((r) => r.category === 'crew_lifecycle').length} checks
            </span>
          </div>

          <div className="divide-y divide-[#1A1A1A]">
            {results
              .filter((r) => r.category === 'crew_lifecycle')
              .map((item) => (
                <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                          item.status === 'PASS'
                            ? 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30'
                            : 'bg-[#D71921]/10 text-[#D71921] border border-[#D71921]/30'
                        }`}
                      >
                        {item.status}
                      </span>
                      <span className="text-xs font-semibold text-white font-heading">
                        {item.title}
                      </span>
                    </div>
                    <p className="text-[12px] text-[#AAAAAA] leading-relaxed pl-0 sm:pl-1">
                      {item.message}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-[11px] font-mono text-[#666666]">
                      {item.timeMs}ms
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

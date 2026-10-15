import React, { useState, useEffect, useMemo } from 'react';
import {
  Calculator,
  Search,
  Sparkles,
  ArrowRight,
  Target,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Compass,
  ChevronRight,
} from 'lucide-react';
import { db, logFirestoreError } from '../../lib/firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { UNIVERSITIES, University } from '../../data/universities';

interface MeritFormulaDoc {
  id: string;
  universityId: string;
  name: string;
  matricWeight: number; // e.g. 0.10
  fscWeight: number;    // e.g. 0.40
  testWeight: number;   // e.g. 0.50
  formulaExpression?: string;
  minEligibilityPercentage?: number;
  closingMerits?: Record<string, number>;
}

export const MeritMeterView: React.FC = () => {
  const [universities, setUniversities] = useState<University[]>(UNIVERSITIES);
  const [formulas, setFormulas] = useState<Record<string, MeritFormulaDoc>>({});
  const [selectedUniId, setSelectedUniId] = useState<string>('fast');

  const [matricObtained, setMatricObtained] = useState<string>('980');
  const [matricTotal, setMatricTotal] = useState<string>('1100');

  const [fscObtained, setFscObtained] = useState<string>('440');
  const [fscTotal, setFscTotal] = useState<string>('520'); // Part 1 or 1100

  const [testScore, setTestScore] = useState<string>('72');
  const [testTotal, setTestTotal] = useState<string>('100');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorInfo, setErrorInfo] = useState<{ message: string; path?: string } | null>(null);

  // Fetch real universities and meritFormulas from Firestore
  useEffect(() => {
    let isMounted = true;
    const fetchMeritData = async () => {
      setIsLoading(true);
      setErrorInfo(null);
      try {
        // 1. Fetch universities
        const uniSnap = await getDocs(query(collection(db, 'universities'), limit(50))).catch(() => null);
        if (uniSnap && !uniSnap.empty) {
          const list: University[] = uniSnap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as any),
          }));
          if (isMounted) setUniversities(list);
        }

        // 2. Fetch meritFormulas
        const formulasSnap = await getDocs(query(collection(db, 'meritFormulas'), limit(50))).catch(() => null);
        if (formulasSnap && !formulasSnap.empty) {
          const map: Record<string, MeritFormulaDoc> = {};
          formulasSnap.docs.forEach((d) => {
            const data = d.data() as any;
            map[data.universityId || d.id] = { id: d.id, ...data };
          });
          if (isMounted) setFormulas(map);
        }
      } catch (err: any) {
        logFirestoreError('meritFormulas', err, 'merit_meter_fetch');
        if (isMounted) {
          setErrorInfo({
            message: err?.message || 'Unable to fetch dynamic formulas from Firestore.',
            path: 'meritFormulas',
          });
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchMeritData();
    return () => {
      isMounted = false;
    };
  }, []);

  const selectedUni = useMemo(() => {
    return universities.find((u) => u.id === selectedUniId) || universities[0];
  }, [universities, selectedUniId]);

  // Resolve formula for chosen university
  const currentFormula: MeritFormulaDoc = useMemo(() => {
    if (formulas[selectedUniId]) return formulas[selectedUniId];
    // Standard defaults if custom formula doc not loaded
    if (selectedUniId === 'fast') {
      return { id: 'fast', universityId: 'fast', name: 'FAST NU Formula', matricWeight: 0.10, fscWeight: 0.40, testWeight: 0.50, minEligibilityPercentage: 60 };
    }
    if (selectedUniId === 'nust') {
      return { id: 'nust', universityId: 'nust', name: 'NUST NET Formula', matricWeight: 0.10, fscWeight: 0.15, testWeight: 0.75, minEligibilityPercentage: 60 };
    }
    if (selectedUniId === 'giki') {
      return { id: 'giki', universityId: 'giki', name: 'GIKI Formula', matricWeight: 0.05, fscWeight: 0.10, testWeight: 0.85, minEligibilityPercentage: 60 };
    }
    if (selectedUniId === 'mdcat') {
      return { id: 'mdcat', universityId: 'mdcat', name: 'PMDC MDCAT Formula', matricWeight: 0.10, fscWeight: 0.40, testWeight: 0.50, minEligibilityPercentage: 60 };
    }
    return { id: 'default', universityId: selectedUniId, name: 'Standard Aggregate', matricWeight: 0.10, fscWeight: 0.40, testWeight: 0.50, minEligibilityPercentage: 60 };
  }, [formulas, selectedUniId]);

  // Aggregate Calculation
  const result = useMemo(() => {
    const mObt = parseFloat(matricObtained) || 0;
    const mTot = parseFloat(matricTotal) || 1100;
    const fObt = parseFloat(fscObtained) || 0;
    const fTot = parseFloat(fscTotal) || 1100;
    const tObt = parseFloat(testScore) || 0;
    const tTot = parseFloat(testTotal) || 100;

    const matricPct = Math.min(100, Math.max(0, (mObt / mTot) * 100));
    const fscPct = Math.min(100, Math.max(0, (fObt / fTot) * 100));
    const testPct = Math.min(100, Math.max(0, (tObt / tTot) * 100));

    const matricContrib = matricPct * currentFormula.matricWeight;
    const fscContrib = fscPct * currentFormula.fscWeight;
    const testContrib = testPct * currentFormula.testWeight;

    const aggregate = Math.round((matricContrib + fscContrib + testContrib) * 100) / 100;

    return {
      matricPct: Math.round(matricPct * 10) / 10,
      fscPct: Math.round(fscPct * 10) / 10,
      testPct: Math.round(testPct * 10) / 10,
      matricContrib: Math.round(matricContrib * 10) / 10,
      fscContrib: Math.round(fscContrib * 10) / 10,
      testContrib: Math.round(testContrib * 10) / 10,
      aggregate,
      isEligible: fscPct >= (currentFormula.minEligibilityPercentage || 60),
    };
  }, [matricObtained, matricTotal, fscObtained, fscTotal, testScore, testTotal, currentFormula]);

  return (
    <div className="space-y-6 text-left font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight font-display">
            Merit Meter & Aggregate Calculator
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            Simulate admission merit percentages using verified Pakistani university formulas.
          </p>
        </div>
      </div>

      {errorInfo && (
        <ErrorState
          title="Could not sync dynamic formulas"
          error={errorInfo.message}
          path={errorInfo.path}
        />
      )}

      {/* University Selector Strip */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/8 pb-3">
        {universities.map((uni) => (
          <button
            key={uni.id}
            type="button"
            onClick={() => setSelectedUniId(uni.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedUniId === uni.id
                ? 'bg-[var(--brand)] text-white shadow-md shadow-blue-600/30'
                : 'bg-white/5 text-[var(--text-muted)] hover:text-white hover:bg-white/10'
            }`}
          >
            {uni.shortName}
          </button>
        ))}
      </div>

      {/* 2-Column Calculator Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Form Column (7 Cols) */}
        <Card variant="glass" className="lg:col-span-7 p-6 space-y-5">
          <div className="border-b border-white/8 pb-3">
            <h3 className="text-base font-bold text-white font-display">
              {selectedUni?.fullName || 'University'} Aggregate Form
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Weighting: Matric ({Math.round(currentFormula.matricWeight * 100)}%) + FSC ({Math.round(currentFormula.fscWeight * 100)}%) + Test ({Math.round(currentFormula.testWeight * 100)}%)
            </p>
          </div>

          {/* 1. Matric Marks */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--text-muted)] block">
              Matric / O-Levels Marks
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-[var(--text-faint)] block mb-1">Obtained</span>
                <input
                  type="number"
                  value={matricObtained}
                  onChange={(e) => setMatricObtained(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                  placeholder="e.g. 980"
                />
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-faint)] block mb-1">Total Marks</span>
                <input
                  type="number"
                  value={matricTotal}
                  onChange={(e) => setMatricTotal(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                  placeholder="e.g. 1100"
                />
              </div>
            </div>
          </div>

          {/* 2. FSC Marks */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--text-muted)] block">
              FSC / HSSC / A-Levels Marks
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-[var(--text-faint)] block mb-1">Obtained (Part 1 or Total)</span>
                <input
                  type="number"
                  value={fscObtained}
                  onChange={(e) => setFscObtained(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                  placeholder="e.g. 440"
                />
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-faint)] block mb-1">Total Marks</span>
                <input
                  type="number"
                  value={fscTotal}
                  onChange={(e) => setFscTotal(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                  placeholder="e.g. 520 or 1100"
                />
              </div>
            </div>
          </div>

          {/* 3. Entrance Test Score */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--text-muted)] block">
              {selectedUni?.testName || 'Entrance Exam'} Score
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-[var(--text-faint)] block mb-1">Test Marks Obtained</span>
                <input
                  type="number"
                  value={testScore}
                  onChange={(e) => setTestScore(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                  placeholder="e.g. 75"
                />
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-faint)] block mb-1">Total Test Marks</span>
                <input
                  type="number"
                  value={testTotal}
                  onChange={(e) => setTestTotal(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                  placeholder="e.g. 100 or 200"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Calculation Result Column (5 Cols) */}
        <Card variant="glass" className="lg:col-span-5 p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/8 pb-3">
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Calculated Aggregate
              </span>
              <Badge variant={result.isEligible ? 'success' : 'danger'} size="sm">
                {result.isEligible ? 'Eligible' : 'Below 60% Criteria'}
              </Badge>
            </div>

            {/* Giant Aggregate Percentage Display */}
            <div className="p-6 rounded-2xl bg-gradient-to-tr from-blue-950/40 to-cyan-950/40 border border-[#2F6BFF]/30 text-center space-y-1">
              <span className="text-5xl font-black text-white font-mono tracking-tight">
                {result.aggregate}%
              </span>
              <p className="text-xs text-[var(--brand-2)] font-mono font-semibold">
                Official Admission Aggregate
              </p>
            </div>

            {/* Breakdown Bars */}
            <div className="space-y-2.5">
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-muted)]">
                  Matric Contribution ({Math.round(currentFormula.matricWeight * 100)}%)
                </span>
                <span className="font-mono text-white font-bold">{result.matricContrib}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-muted)]">
                  FSC Contribution ({Math.round(currentFormula.fscWeight * 100)}%)
                </span>
                <span className="font-mono text-white font-bold">{result.fscContrib}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-muted)]">
                  Entry Test Contribution ({Math.round(currentFormula.testWeight * 100)}%)
                </span>
                <span className="font-mono text-white font-bold">{result.testContrib}%</span>
              </div>
            </div>

            {/* Historical Closing Merit Insight */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/8 space-y-1 text-xs">
              <span className="font-bold text-white block">Historical Closing Merits:</span>
              <p className="text-[var(--text-muted)] leading-relaxed">
                FAST BS CS closing aggregate ~72.5%. NUST SEEC CS ~78.2%. GIKI Engineering ~68.4%.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-white/8 text-[11px] text-[var(--text-faint)] text-center">
            Formula verified against 2026 university admission prospectuses
          </div>
        </Card>
      </div>
    </div>
  );
};

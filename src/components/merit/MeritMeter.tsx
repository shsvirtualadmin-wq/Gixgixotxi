import React, { useState, useMemo, useEffect } from 'react';
import {
  Calculator,
  Search,
  ExternalLink,
  Share2,
  Check,
  ChevronDown,
  ChevronUp,
  Target,
  Sparkles,
  AlertCircle,
  GraduationCap,
} from 'lucide-react';
import { UNIVERSITIES_CONFIG, UniversityConfig, getUniversityById } from '../../config/universities';
import { UniversityLogo } from '../universities/UniversityLogo';
import { SeoHead } from '../common/SeoHead';

interface MeritMeterProps {
  initialUniId?: string;
  onStartPractice?: () => void;
  onExploreMore?: () => void;
}

export const MeritMeter: React.FC<MeritMeterProps> = ({
  initialUniId,
  onStartPractice,
  onExploreMore,
}) => {
  // Read query params if present: ?uni=xyz
  const resolvedInitialId = useMemo(() => {
    if (initialUniId) return initialUniId;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const uniParam = params.get('uni');
      if (uniParam) return uniParam;
    }
    return '';
  }, [initialUniId]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUni, setSelectedUni] = useState<UniversityConfig | null>(() => {
    return getUniversityById(resolvedInitialId) || null;
  });
  const [selectedProgram, setSelectedProgram] = useState<string>('');

  // Form Inputs
  const [matricObtained, setMatricObtained] = useState<string>('');
  const [matricTotal, setMatricTotal] = useState<string>('1100');
  const [fscObtained, setFscObtained] = useState<string>('');
  const [fscTotal, setFscTotal] = useState<string>('1100');
  const [testScore, setTestScore] = useState<string>('');
  const [testTotal, setTestTotal] = useState<string>('100');

  // Inline Validation Errors
  const [errors, setErrors] = useState<{
    matric?: string;
    fsc?: string;
    test?: string;
  }>({});

  const [showCalculationSteps, setShowCalculationSteps] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  // When university changes, reset program and test total defaults
  useEffect(() => {
    if (selectedUni) {
      setSelectedProgram(selectedUni.programs[0] || '');
      // Some tests have known defaults (e.g. NET is 200, ECAT is 400, FAST is 100, MDCAT is 200)
      if (selectedUni.id === 'nust' || selectedUni.id === 'nums' || selectedUni.id === 'pmdc-mdcat') {
        setTestTotal('200');
      } else if (selectedUni.id === 'uet') {
        setTestTotal('400');
      } else {
        setTestTotal('100');
      }
    }
  }, [selectedUni?.id]);

  // Filtered universities for picker
  const filteredUnis = useMemo(() => {
    if (!searchQuery.trim()) return UNIVERSITIES_CONFIG;
    const q = searchQuery.toLowerCase();
    return UNIVERSITIES_CONFIG.filter(
      (u) =>
        u.shortName.toLowerCase().includes(q) ||
        u.fullName.toLowerCase().includes(q) ||
        u.city.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Calculate aggregate
  const calculationResult = useMemo(() => {
    if (!selectedUni) return null;

    const mObt = parseFloat(matricObtained);
    const mTot = parseFloat(matricTotal);
    const fObt = parseFloat(fscObtained);
    const fTot = parseFloat(fscTotal);
    const tObt = parseFloat(testScore);
    const tTot = parseFloat(testTotal);

    const validation: { matric?: string; fsc?: string; test?: string } = {};

    // Matric check
    if (isNaN(mObt) || isNaN(mTot)) {
      validation.matric = 'Please enter valid numerical scores.';
    } else if (mObt < 0 || mTot <= 0) {
      validation.matric = 'Score must be non-negative and total must be > 0.';
    } else if (mObt > mTot) {
      validation.matric = 'Obtained marks cannot exceed total marks.';
    }

    // FSc check
    if (isNaN(fObt) || isNaN(fTot)) {
      validation.fsc = 'Please enter valid numerical scores.';
    } else if (fObt < 0 || fTot <= 0) {
      validation.fsc = 'Score must be non-negative and total must be > 0.';
    } else if (fObt > fTot) {
      validation.fsc = 'Obtained marks cannot exceed total marks.';
    }

    // Test check
    if (selectedUni.weights.test > 0) {
      if (isNaN(tObt) || isNaN(tTot)) {
        validation.test = 'Please enter valid entry test marks.';
      } else if (tObt < 0 || tTot <= 0) {
        validation.test = 'Test score must be non-negative and total must be > 0.';
      } else if (tObt > tTot) {
        validation.test = 'Obtained score cannot exceed test total.';
      }
    }

    // Guard against weights not adding up to 100
    const weightSum =
      selectedUni.weights.matric + selectedUni.weights.fsc + selectedUni.weights.test;
    const scaleFactor = weightSum > 0 ? 100 / weightSum : 1;

    const matricPct = mTot > 0 && !isNaN(mObt) ? (mObt / mTot) * 100 : 0;
    const fscPct = fTot > 0 && !isNaN(fObt) ? (fObt / fTot) * 100 : 0;
    const testPct = tTot > 0 && !isNaN(tObt) ? (tObt / tTot) * 100 : 0;

    const matricComponent = (matricPct * selectedUni.weights.matric) / 100;
    const fscComponent = (fscPct * selectedUni.weights.fsc) / 100;
    const testComponent = (testPct * selectedUni.weights.test) / 100;

    const rawAggregate = (matricComponent + fscComponent + testComponent) * scaleFactor;
    const finalAggregate = Math.min(100, Math.max(0, Math.round(rawAggregate * 100) / 100));

    const isValid = Object.keys(validation).length === 0;

    return {
      isValid,
      validation,
      matricPct: Math.round(matricPct * 100) / 100,
      fscPct: Math.round(fscPct * 100) / 100,
      testPct: Math.round(testPct * 100) / 100,
      matricComponent: Math.round(matricComponent * 100) / 100,
      fscComponent: Math.round(fscComponent * 100) / 100,
      testComponent: Math.round(testComponent * 100) / 100,
      aggregate: finalAggregate,
    };
  }, [
    selectedUni,
    matricObtained,
    matricTotal,
    fscObtained,
    fscTotal,
    testScore,
    testTotal,
  ]);

  // Closing merit evaluation (DATA RULE: Never invent numbers)
  const closingMeritValue = selectedUni?.closingMerits?.[selectedProgram];

  const chanceCategory = useMemo(() => {
    if (!calculationResult?.isValid || !closingMeritValue) return null;
    const diff = calculationResult.aggregate - closingMeritValue;
    if (diff >= 1.5) {
      return {
        label: 'Strong chance',
        chipClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        text: `Your aggregate (${calculationResult.aggregate}%) is safely above the recent closing merit (${closingMeritValue}%).`,
      };
    } else if (diff >= -1.5) {
      return {
        label: 'Borderline',
        chipClass: 'bg-amber-50 text-amber-700 border-amber-200',
        text: `Your aggregate (${calculationResult.aggregate}%) is very close to recent closing merit (${closingMeritValue}%). Additional entrance test marks will secure your seat.`,
      };
    } else {
      return {
        label: 'Needs improvement',
        chipClass: 'bg-rose-50 text-rose-700 border-rose-200',
        text: `Your aggregate (${calculationResult.aggregate}%) is currently below the recent closing merit (${closingMeritValue}%). Focus on upcoming entry test retakes.`,
      };
    }
  }, [calculationResult, closingMeritValue]);

  const handleShareResult = () => {
    if (!selectedUni || !calculationResult?.isValid) return;
    const text = `I calculated my admission aggregate for ${selectedUni.shortName} (${selectedProgram}): ${calculationResult.aggregate}% using Boardly Merit Meter!\nCheck yours at: https://boardly.cfd/merit-meter?uni=${selectedUni.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  return (
    <div className="min-h-[100dvh] pt-24 pb-20 px-4 sm:px-6 max-w-4xl mx-auto">
      <SeoHead pathname="/merit-meter" />

      {/* Header */}
      <div className="text-center space-y-3 mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold">
          <Calculator className="w-3.5 h-3.5 text-indigo-600" />
          <span>Official Formula Aggregate Engine</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-[#0d1b3e] tracking-tight">
          Boardly <span className="text-indigo-600">Merit Meter</span>
        </h1>
        <p className="text-sm text-slate-600 max-w-xl mx-auto font-medium">
          Calculate your exact admission percentage based on official prospectus formulas and compare against historical closing merits.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: University Selection & Scores Input (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Step 1: Searchable University Picker */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-white shadow-xl shadow-indigo-950/5 space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              1. Select Target University
            </label>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search university (e.g. NUST, FAST, UET, GIKI)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* University Selection Grid */}
            <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
              {filteredUnis.map((uni) => {
                const isSelected = selectedUni?.id === uni.id;
                return (
                  <button
                    key={uni.id}
                    type="button"
                    onClick={() => {
                      setSelectedUni(uni);
                      setSearchQuery('');
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 border border-indigo-200/80 shadow-xs'
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <UniversityLogo
                        src={uni.logo}
                        alt={uni.shortName}
                        className="w-9 h-9 rounded-xl shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#0d1b3e] truncate">
                          {uni.shortName}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {uni.fullName}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mr-1" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Program Picker if selected */}
            {selectedUni && selectedUni.programs.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Target Degree Program
                </label>
                <select
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {selectedUni.programs.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Step 2: Academic Marks Input */}
          {selectedUni && (
            <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-white shadow-xl shadow-indigo-950/5 space-y-5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  2. Enter Your Academic Scores
                </label>
                <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                  Formula: {selectedUni.weights.matric}% M · {selectedUni.weights.fsc}% FSc · {selectedUni.weights.test}% Test
                </span>
              </div>

              {/* Matric */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Matric / O-Levels (Weight: {selectedUni.weights.matric}%)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="number"
                      placeholder="Obtained (e.g. 1020)"
                      value={matricObtained}
                      onChange={(e) => setMatricObtained(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Total (e.g. 1100)"
                      value={matricTotal}
                      onChange={(e) => setMatricTotal(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                {calculationResult?.validation?.matric && (
                  <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{calculationResult.validation.matric}</span>
                  </p>
                )}
              </div>

              {/* FSc */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  FSc / A-Levels / HSSC (Weight: {selectedUni.weights.fsc}%)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="number"
                      placeholder="Obtained (e.g. 480)"
                      value={fscObtained}
                      onChange={(e) => setFscObtained(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Total (e.g. 520 or 1100)"
                      value={fscTotal}
                      onChange={(e) => setFscTotal(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                {calculationResult?.validation?.fsc && (
                  <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{calculationResult.validation.fsc}</span>
                  </p>
                )}
              </div>

              {/* Entry Test */}
              {selectedUni.weights.test > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    {selectedUni.entryTestName} (Weight: {selectedUni.weights.test}%)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type="number"
                        placeholder="Obtained Score"
                        value={testScore}
                        onChange={(e) => setTestScore(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        placeholder={`Total (e.g. ${testTotal})`}
                        value={testTotal}
                        onChange={(e) => setTestTotal(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  {calculationResult?.validation?.test && (
                    <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{calculationResult.validation.test}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Calculation Result, Progress Ring & Comparison (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {selectedUni ? (
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 border border-white shadow-xl shadow-indigo-950/5 space-y-6 text-center">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Calculated Admission Aggregate
                </span>
                <h3 className="text-lg font-black text-[#0d1b3e]">
                  {selectedUni.shortName} · {selectedProgram || 'Program'}
                </h3>
              </div>

              {/* Big percentage in progress ring */}
              <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    className="stroke-slate-100"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    className="stroke-indigo-600 transition-all duration-500 ease-out"
                    strokeWidth="10"
                    strokeDasharray={2 * Math.PI * 52}
                    strokeDashoffset={
                      calculationResult?.isValid
                        ? 2 * Math.PI * 52 * (1 - calculationResult.aggregate / 100)
                        : 2 * Math.PI * 52
                    }
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl sm:text-4xl font-black text-[#0d1b3e]">
                    {calculationResult?.isValid ? `${calculationResult.aggregate}%` : '--%'}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Total Aggregate
                  </span>
                </div>
              </div>

              {/* Chance comparison chip */}
              {chanceCategory ? (
                <div className={`p-3.5 rounded-2xl border text-xs text-left space-y-1.5 ${chanceCategory.chipClass}`}>
                  <div className="flex items-center justify-between font-bold">
                    <span>Recent Closing Merit: {closingMeritValue}%</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/80 border">
                      {chanceCategory.label}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {chanceCategory.text}
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-slate-500 text-xs">
                  <span>Closing merit data coming soon for this program.</span>
                </div>
              )}

              {/* Expandable "How this is calculated" steps */}
              <div className="text-left border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCalculationSteps((p) => !p)}
                  className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-indigo-600 py-1 cursor-pointer"
                >
                  <span>How this is calculated</span>
                  {showCalculationSteps ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {showCalculationSteps && calculationResult?.isValid && (
                  <div className="mt-2.5 p-3 rounded-2xl bg-slate-50 space-y-2 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Matric ({calculationResult.matricPct}% × {selectedUni.weights.matric}%)</span>
                      <span className="font-bold text-slate-800">+{calculationResult.matricComponent}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>FSc ({calculationResult.fscPct}% × {selectedUni.weights.fsc}%)</span>
                      <span className="font-bold text-slate-800">+{calculationResult.fscComponent}%</span>
                    </div>
                    {selectedUni.weights.test > 0 && (
                      <div className="flex justify-between">
                        <span>Test ({calculationResult.testPct}% × {selectedUni.weights.test}%)</span>
                        <span className="font-bold text-slate-800">+{calculationResult.testComponent}%</span>
                      </div>
                    )}
                    <div className="border-t border-slate-200/80 pt-1.5 flex justify-between font-extrabold text-[#0d1b3e]">
                      <span>Final Aggregate</span>
                      <span>{calculationResult.aggregate}%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Official Disclaimer */}
              <p className="text-[11px] text-slate-400 leading-relaxed italic">
                Estimate only, verify with the{' '}
                <a
                  href={selectedUni.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 underline font-semibold inline-flex items-center gap-0.5"
                >
                  <span>official prospectus</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>.
              </p>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleShareResult}
                  disabled={!calculationResult?.isValid}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {copiedShare ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share Result</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onStartPractice) onStartPractice();
                    else {
                      if (typeof window !== 'undefined') {
                        window.history.pushState({}, '', '/app');
                        window.dispatchEvent(new PopStateEvent('popstate'));
                      }
                    }
                  }}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>Practice for the Entry Test</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedUni(null);
                    setSearchQuery('');
                  }}
                  className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Try another university
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-white shadow-xl shadow-indigo-950/5 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600">
                <Calculator className="w-7 h-7" />
              </div>
              <h3 className="font-extrabold text-[#0d1b3e] text-base">
                Select a University to Begin
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Pick NUST, FAST-NU, UET, GIKI, or any supported institution to load its official weighting formula.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

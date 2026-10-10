import React, { useState, useMemo } from 'react';
import { X, Calculator, Sparkles, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { UNIVERSITIES } from '../../data/universities';
import { UniversityLogoBadge } from '../UniversityLogoBadge';

interface MeritMeterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UniversityFormula {
  id: string;
  name: string;
  testName: string;
  testTotal: number;
  closingMeritRange: string;
  calculate: (matricPct: number, fscPct: number, testScore: number) => number;
}

const FORMULAS: UniversityFormula[] = [
  {
    id: 'fast',
    name: 'FAST-NU',
    testName: 'FAST-NU Test',
    testTotal: 100,
    closingMeritRange: '68% – 76% (CS/SE)',
    calculate: (_m, fsc, test) => {
      // 50% Entry test + 50% FSC
      return (test / 100) * 50 + fsc * 0.5;
    },
  },
  {
    id: 'nust',
    name: 'NUST',
    testName: 'NET',
    testTotal: 200,
    closingMeritRange: '74% – 82% (SEECS)',
    calculate: (matric, fsc, test) => {
      // 75% NET + 15% FSC + 10% Matric
      const netPct = (test / 200) * 100;
      return netPct * 0.75 + fsc * 0.15 + matric * 0.1;
    },
  },
  {
    id: 'giki',
    name: 'GIKI',
    testName: 'GIKI Admission Test',
    testTotal: 80,
    closingMeritRange: '70% – 78% (Engineering)',
    calculate: (_m, fsc, test) => {
      // 85% Admission test + 15% HSSC
      const testPct = (test / 80) * 100;
      return testPct * 0.85 + fsc * 0.15;
    },
  },
  {
    id: 'ecat',
    name: 'UET ECAT',
    testName: 'ECAT',
    testTotal: 400,
    closingMeritRange: '70% – 80% (Main Campus)',
    calculate: (matric, fsc, test) => {
      // 33% ECAT + 50% FSC + 17% Matric
      const ecatPct = (test / 400) * 100;
      return ecatPct * 0.33 + fsc * 0.5 + matric * 0.17;
    },
  },
  {
    id: 'iba',
    name: 'IBA Karachi',
    testName: 'Aptitude Test',
    testTotal: 100,
    closingMeritRange: 'Direct Cutoff (Maths ≥ 60%, English ≥ 60%)',
    calculate: (_m, fsc, test) => {
      return (test / 100) * 60 + fsc * 0.4;
    },
  },
];

export const MeritMeterModal: React.FC<MeritMeterModalProps> = ({ isOpen, onClose }) => {
  const [selectedUniId, setSelectedUniId] = useState<string>('fast');
  const [matricObtained, setMatricObtained] = useState<string>('980');
  const [matricTotal, setMatricTotal] = useState<string>('1100');
  const [fscObtained, setFscObtained] = useState<string>('440');
  const [fscTotal, setFscTotal] = useState<string>('520');
  const [testScore, setTestScore] = useState<string>('72');

  if (!isOpen) return null;

  const currentFormula = FORMULAS.find((f) => f.id === selectedUniId) || FORMULAS[0];

  const matricPct = useMemo(() => {
    const ob = parseFloat(matricObtained) || 0;
    const tot = parseFloat(matricTotal) || 1100;
    return Math.min(100, Math.max(0, (ob / tot) * 100));
  }, [matricObtained, matricTotal]);

  const fscPct = useMemo(() => {
    const ob = parseFloat(fscObtained) || 0;
    const tot = parseFloat(fscTotal) || 520;
    return Math.min(100, Math.max(0, (ob / tot) * 100));
  }, [fscObtained, fscTotal]);

  const aggregateScore = useMemo(() => {
    const score = parseFloat(testScore) || 0;
    const calculated = currentFormula.calculate(matricPct, fscPct, score);
    return Math.min(100, Math.max(0, Math.round(calculated * 100) / 100));
  }, [currentFormula, matricPct, fscPct, testScore]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fadeIn font-sans">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-2xl border border-white/80 shadow-2xl rounded-3xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shadow-sm">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Merit Meter
              </h2>
              <p className="text-xs text-slate-500">
                Official aggregate calculator for top universities.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* University Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Target University & Formula
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {FORMULAS.map((f) => {
              const isSelected = selectedUniId === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setSelectedUniId(f.id);
                    // Adjust test score default for NET
                    if (f.id === 'nust' && parseFloat(testScore) < 100) setTestScore('145');
                    else if (f.id === 'ecat' && parseFloat(testScore) < 150) setTestScore('270');
                    else if (f.id === 'giki' && parseFloat(testScore) > 80) setTestScore('58');
                    else if (f.id === 'fast' && parseFloat(testScore) > 100) setTestScore('72');
                  }}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 text-blue-950 font-bold ring-2 ring-blue-500/20 shadow-sm'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs'
                  }`}
                >
                  <span className="block text-xs font-bold">{f.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Input Fields */}
        <div className="space-y-3.5">
          {/* Matric / O-Levels */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
              <span>Matric / O-Level Marks</span>
              <span className="text-blue-600">{Math.round(matricPct)}%</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Obtained (e.g. 980)"
                value={matricObtained}
                onChange={(e) => setMatricObtained(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <input
                type="number"
                placeholder="Total (e.g. 1100)"
                value={matricTotal}
                onChange={(e) => setMatricTotal(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* FSC / HSSC */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
              <span>FSC Part-1 / HSSC Marks</span>
              <span className="text-blue-600">{Math.round(fscPct)}%</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Obtained (e.g. 440)"
                value={fscObtained}
                onChange={(e) => setFscObtained(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <input
                type="number"
                placeholder="Total (e.g. 520)"
                value={fscTotal}
                onChange={(e) => setFscTotal(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Entry Test Score */}
          <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200/80">
            <div className="flex items-center justify-between text-xs font-bold text-blue-900 mb-1.5">
              <span>Expected {currentFormula.testName} Score</span>
              <span>Out of {currentFormula.testTotal}</span>
            </div>
            <input
              type="number"
              max={currentFormula.testTotal}
              value={testScore}
              onChange={(e) => setTestScore(e.target.value)}
              placeholder={`Score out of ${currentFormula.testTotal}`}
              className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-white text-xs font-bold text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Calculated Result Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white shadow-xl space-y-3 text-center">
          <span className="text-xs font-bold text-blue-100 uppercase tracking-wider block">
            Your Projected {currentFormula.name} Aggregate
          </span>
          <div className="text-4xl sm:text-5xl font-black tracking-tight">
            {aggregateScore}%
          </div>
          <div className="text-xs text-blue-100 pt-1 border-t border-white/20">
            Estimated Closing Merit: <span className="font-bold text-white">{currentFormula.closingMeritRange}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

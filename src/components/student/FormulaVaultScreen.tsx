import React, { useState, useMemo, useEffect } from 'react';
import {
  Sparkles,
  Search,
  BookOpen,
  Calculator,
  Zap,
  FlaskConical,
  Dna,
  BarChart2,
  Binary,
  Brain,
  Coins,
  TrendingUp,
  Star,
  Copy,
  Check,
  Printer,
  ChevronDown,
  Filter,
  X,
  Layers,
  ArrowLeft,
  Share2,
} from 'lucide-react';
import katex from 'katex';
import {
  allFormulaSheets,
  FormulaSheet,
  FormulaItem,
  FormulaSubject,
  SUBJECT_METADATA_CONFIGS,
  getFormulaVaultStats,
  searchFormulaSheets,
} from '../../data/formulaVault';

interface FormulaVaultScreenProps {
  onBack?: () => void;
  defaultSubject?: FormulaSubject;
}

const STORAGE_SAVED_KEY = 'boardly_saved_formulas_v1';

export const FormulaVaultScreen: React.FC<FormulaVaultScreenProps> = ({
  onBack,
  defaultSubject,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<FormulaSubject | 'ALL'>(
    defaultSubject || 'ALL'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<string>('ALL');
  const [savedFormulaNumbers, setSavedFormulaNumbers] = useState<number[]>([]);
  const [onlySavedView, setOnlySavedView] = useState<boolean>(false);
  const [copiedNumber, setCopiedNumber] = useState<number | null>(null);
  const [isPrintMode, setIsPrintMode] = useState<boolean>(false);

  // Load saved bookmarks from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_SAVED_KEY);
      if (stored) {
        setSavedFormulaNumbers(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Error reading saved formulas:', e);
    }
  }, []);

  const toggleSaveFormula = (num: number) => {
    setSavedFormulaNumbers((prev) => {
      const next = prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num];
      try {
        localStorage.setItem(STORAGE_SAVED_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const handleCopyLatex = (latex: string, num: number) => {
    try {
      navigator.clipboard.writeText(latex);
      setCopiedNumber(num);
      setTimeout(() => setCopiedNumber(null), 2000);
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  };

  const stats = useMemo(() => getFormulaVaultStats(), []);

  // Available chapters for current subject
  const availableChapters = useMemo(() => {
    const chapters = new Set<string>();
    allFormulaSheets.forEach((sheet) => {
      if (selectedSubject === 'ALL' || sheet.subject === selectedSubject) {
        chapters.add(sheet.chapter);
      }
    });
    return Array.from(chapters);
  }, [selectedSubject]);

  // Reset chapter filter when subject changes
  useEffect(() => {
    setSelectedChapter('ALL');
  }, [selectedSubject]);

  // Filter sheets and formulas
  const filteredSheets = useMemo(() => {
    const results = searchFormulaSheets(searchQuery, selectedSubject, selectedChapter);

    if (onlySavedView) {
      return results
        .map((sheet) => ({
          ...sheet,
          formulas: sheet.formulas.filter((f) => savedFormulaNumbers.includes(f.number)),
        }))
        .filter((sheet) => sheet.formulas.length > 0);
    }

    return results;
  }, [searchQuery, selectedSubject, selectedChapter, onlySavedView, savedFormulaNumbers]);

  const totalMatchingFormulas = useMemo(() => {
    return filteredSheets.reduce((sum, sheet) => sum + sheet.formulas.length, 0);
  }, [filteredSheets]);

  const renderSubjectIcon = (subjectName: FormulaSubject, className = 'w-4 h-4') => {
    switch (subjectName) {
      case 'Mathematics':
        return <Calculator className={className} />;
      case 'Physics':
        return <Zap className={className} />;
      case 'Chemistry':
        return <FlaskConical className={className} />;
      case 'Biology':
        return <Dna className={className} />;
      case 'Statistics & Probability':
        return <BarChart2 className={className} />;
      case 'Computer Science':
        return <Binary className={className} />;
      case 'English Grammar rules':
        return <BookOpen className={className} />;
      case 'IQ & Logical Reasoning':
        return <Brain className={className} />;
      case 'Accounting & Finance':
        return <Coins className={className} />;
      case 'Economics':
        return <TrendingUp className={className} />;
      default:
        return <Sparkles className={className} />;
    }
  };

  const safeRenderLatex = (latex: string) => {
    try {
      const html = katex.renderToString(latex, {
        displayMode: true,
        throwOnError: false,
        strict: false,
        output: 'html',
      });
      return <div dangerouslySetInnerHTML={{ __html: html }} className="overflow-x-auto py-1" />;
    } catch {
      return <div className="font-mono text-sm text-slate-800 dark:text-slate-200">{latex}</div>;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-950 text-slate-900 dark:text-white pb-24 animate-fade-in font-sans">
      {/* Top Navigation & Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Back to Overview"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                    Formula Vault
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    {stats.totalFormulas}+ Formulas
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Searchable verified equations, derivations & variable definitions across 10 subject fields
                </p>
              </div>
            </div>

            {/* Quick Actions Header: Bookmarks Toggle + Print Mode */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setOnlySavedView(!onlySavedView)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  onlySavedView
                    ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${onlySavedView ? 'fill-white' : 'text-amber-500'}`} />
                <span>Saved Bookmarks ({savedFormulaNumbers.length})</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title="Print Formula Sheets"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-500" />
                <span className="hidden sm:inline">Print Sheets</span>
              </button>
            </div>
          </div>

          {/* Search Bar + Chapter Filter Row */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="relative md:col-span-8">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by formula name, LaTeX symbol (e.g. \frac, \lambda, \Delta), topic or variables..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Chapter Selector Dropdown */}
            <div className="relative md:col-span-4">
              <select
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer pr-8"
              >
                <option value="ALL">All Chapters ({availableChapters.length} active)</option>
                {availableChapters.map((chap) => (
                  <option key={chap} value={chap}>
                    {chap}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Subject Pills Horizontal Scroller */}
          <div className="mt-3.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs select-none">
            <button
              type="button"
              onClick={() => setSelectedSubject('ALL')}
              className={`px-3 py-1.5 rounded-xl font-extrabold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                selectedSubject === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>All Subjects</span>
              <span className="text-[10px] opacity-75 ml-0.5 px-1.5 py-0.2 bg-black/10 dark:bg-white/20 rounded-full">
                {stats.totalFormulas}
              </span>
            </button>

            {SUBJECT_METADATA_CONFIGS.map((sub) => {
              const isSelected = selectedSubject === sub.subject;
              const count = stats.subjectBreakdown[sub.subject]?.formulas || 0;
              return (
                <button
                  key={sub.subject}
                  type="button"
                  onClick={() => setSelectedSubject(sub.subject)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {renderSubjectIcon(sub.subject, 'w-3.5 h-3.5')}
                  <span>{sub.displayName}</span>
                  <span className="text-[10px] opacity-75 ml-0.5 px-1.5 py-0.2 bg-black/10 dark:bg-white/20 rounded-full">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Results Banner */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-4 px-1">
          <div>
            Showing <strong className="text-slate-900 dark:text-white font-extrabold">{totalMatchingFormulas}</strong> formula
            {totalMatchingFormulas === 1 ? '' : 's'} across{' '}
            <strong className="text-slate-900 dark:text-white font-extrabold">{filteredSheets.length}</strong> sheets
            {selectedSubject !== 'ALL' && <span> in {selectedSubject}</span>}
            {selectedChapter !== 'ALL' && <span> • {selectedChapter}</span>}
          </div>

          {(searchQuery || selectedChapter !== 'ALL' || onlySavedView) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedChapter('ALL');
                setOnlySavedView(false);
              }}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Empty State */}
        {filteredSheets.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm max-w-lg mx-auto my-12">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mx-auto mb-4 border border-amber-200 dark:border-amber-800">
              <Search className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              No formulas matched your search
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              {onlySavedView
                ? "You haven't bookmarked any formulas yet. Click the star icon on any formula card to save it here."
                : `We could not find any formulas matching "${searchQuery}". Try a different symbol, term, or topic.`}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedChapter('ALL');
                setSelectedSubject('ALL');
                setOnlySavedView(false);
              }}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-md shadow-indigo-600/20"
            >
              Browse All 1,007 Formulas
            </button>
          </div>
        ) : (
          /* Rendered Sheets */
          <div className="space-y-8">
            {filteredSheets.map((sheet) => (
              <div
                key={sheet.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800/90 p-5 sm:p-7 shadow-xs space-y-5"
              >
                {/* Sheet Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                        {sheet.subject}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {sheet.chapter}
                      </span>
                    </div>
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                      {sheet.title}
                    </h2>
                  </div>

                  {/* Sheet Topic Tags */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {sheet.tags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setSearchQuery(tag)}
                        className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Formulas Grid for this Sheet */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sheet.formulas.map((item) => {
                    const isSaved = savedFormulaNumbers.includes(item.number);
                    const isCopied = copiedNumber === item.number;

                    return (
                      <div
                        key={item.number}
                        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#FAFBFD] dark:bg-slate-950/70 p-4 sm:p-5 flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-800 transition-all hover:shadow-md group relative"
                      >
                        <div>
                          {/* Card Top: Number + Name + Controls */}
                          <div className="flex items-start justify-between gap-3 mb-2.5">
                            <div className="flex items-start gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-black tracking-tight shrink-0 mt-0.5">
                                #{item.number}
                              </span>
                              <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug">
                                {item.name}
                              </h3>
                            </div>

                            {/* Bookmark & Copy buttons */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleCopyLatex(item.formula, item.number)}
                                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                                  isCopied
                                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300'
                                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                                }`}
                                title="Copy LaTeX Formula"
                              >
                                {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>

                              <button
                                type="button"
                                onClick={() => toggleSaveFormula(item.number)}
                                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                                  isSaved
                                    ? 'text-amber-500 fill-amber-500 bg-amber-50 dark:bg-amber-950/40'
                                    : 'text-slate-400 hover:text-amber-500 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                                }`}
                                title={isSaved ? 'Remove from Saved' : 'Save to Bookmarks'}
                              >
                                <Star className={`w-3.5 h-3.5 ${isSaved ? 'fill-amber-500' : ''}`} />
                              </button>
                            </div>
                          </div>

                          {/* Rendered Math Formula Display Box */}
                          <div className="my-3 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center text-slate-900 dark:text-white min-h-[64px] text-center shadow-xs">
                            {safeRenderLatex(item.formula)}
                          </div>
                        </div>

                        {/* Variables & Application Notes Box */}
                        {item.variables && (
                          <div className="mt-2 pt-2.5 border-t border-slate-200/70 dark:border-slate-800/80 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                            <span className="font-bold text-slate-800 dark:text-slate-200 block text-[10px] uppercase tracking-wider mb-0.5 text-indigo-600 dark:text-indigo-400">
                              Parameters & Context
                            </span>
                            {item.variables}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FormulaVaultScreen;

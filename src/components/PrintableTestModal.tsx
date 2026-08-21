import React, { useState } from 'react';
import { TestResult } from '../types';
import { User, StudentProfile, isUserProOrPaid } from '../lib/supabase';
import { downloadQuizPdf } from '../lib/pdfGenerator';
import { PdfWatermarkOverlay } from '../lib/pdfWatermark';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { MathText } from './MathText';
import { Printer, Download, X } from 'lucide-react';
import { checkAndRecordPdfDownload } from '../lib/pdfLimit';
import { PdfRestrictionModal } from './PdfRestrictionModal';

interface PrintableTestModalProps {
  result: TestResult;
  currentUser?: User | null;
  userProfile?: StudentProfile | null;
  onClose: () => void;
  onUpgradeClick?: () => void;
}

export const PrintableTestModal: React.FC<PrintableTestModalProps> = ({
  result,
  currentUser,
  userProfile,
  onClose,
  onUpgradeClick,
}) => {
  const { logoUrl } = useSiteSettings();
  const activeLogo = logoUrl || "https://i.ibb.co/ymPFp2Wb/Chat-Box-1256234838.jpg";
  const [includeAnswerKey, setIncludeAnswerKey] = useState(true);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [restrictionInfo, setRestrictionInfo] = useState<{
    reason: string;
    message?: string;
    remainingMs?: number;
    nextAvailableAt?: string;
    isProHint?: boolean;
    userProfile?: StudentProfile | null;
  } | null>(null);

  const containsUrdu = (text: string) =>
    /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text || '');

  const isUrduOrIslamiat =
    ['urdu', 'islam', 'din'].some((term) => (result.config?.subject || '').toLowerCase().includes(term)) ||
    result.questions.some((q) => containsUrdu(q.q) || q.options.some((o) => containsUrdu(o)));

  const urduChoiceLabels = ['الف', 'ب', 'ج', 'د'];

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setRestrictionInfo(null);
    setIsDownloadingPdf(true);
    setPdfError(null);
    try {
      let activeProf = userProfile;
      if (!activeProf) {
        try {
          if (currentUser?.id) {
            const cached = localStorage.getItem(`boardly_profile_${currentUser.id}`);
            if (cached) activeProf = JSON.parse(cached);
          }
          if (!activeProf) {
            const cached = localStorage.getItem('boardly_cached_profile');
            if (cached) activeProf = JSON.parse(cached);
          }
        } catch (e) {}
      }

      let activeUser = currentUser;
      if (!activeUser) {
        try {
          const cachedUser = localStorage.getItem('boardly_cached_user');
          if (cachedUser) activeUser = JSON.parse(cachedUser);
        } catch (e) {}
      }

      const isProHint = isUserProOrPaid(activeUser, activeProf);
      const pkgHint = activeProf?.package_name || (activeUser as any)?.package_name || (activeUser as any)?.user_metadata?.package_name || '';
      const effectiveUserId = activeUser?.id || activeProf?.id || (activeProf as any)?.user_id;
      const effectiveEmail = activeUser?.email || activeProf?.email;

      // Detailed inspection logging for entitlement debugging at exact moment of button click / check
      console.log('[PrintableTestModal] PDF Download entitlement check initiated:', {
        userProfile,
        activeProf,
        currentUser,
        activeUser,
        is_pro: activeProf?.is_pro ?? userProfile?.is_pro ?? (activeUser as any)?.is_pro ?? activeUser?.user_metadata?.is_pro,
        payment_status: activeProf?.payment_status ?? userProfile?.payment_status ?? activeUser?.user_metadata?.payment_status,
        package_name: activeProf?.package_name ?? userProfile?.package_name ?? pkgHint,
        isProHint,
        effectiveUserId,
        effectiveEmail,
      });

      if (isProHint) {
        // Pro users get unlimited PDF downloads without rate limit
        console.log('[PrintableTestModal] Pro user detected — bypassing download restriction modal.');
        checkAndRecordPdfDownload(effectiveUserId, effectiveEmail, true, pkgHint, activeProf).catch(() => {});
      } else {
        const checkRes = await Promise.race([
          checkAndRecordPdfDownload(effectiveUserId, effectiveEmail, isProHint, pkgHint, activeProf),
          new Promise<any>((_, reject) =>
            setTimeout(() => reject(new Error('Permission check timed out. Please check your connection and try again.')), 8000)
          ),
        ]);

        if (!checkRes.allowed) {
          if (checkRes.isPro || isProHint) {
            console.log('[PrintableTestModal] User is Pro — allowing PDF download without rate limit.');
          } else {
            console.warn('[PrintableTestModal] PDF Download restricted for free user:', checkRes.reason);
            setRestrictionInfo({
              reason: checkRes.reason || 'FREE_USER',
              message: checkRes.message || 'PDF downloads are a Pro feature — upgrade to unlock unlimited access',
              remainingMs: checkRes.remainingMs,
              nextAvailableAt: checkRes.nextAvailableAt,
              isProHint,
              userProfile: activeProf,
            });
            return;
          }
        }
      }

      const gradeOrPath = `Class ${result.config?.classNum}${result.config?.group ? ` (${result.config.group})` : ''}`;

      await Promise.race([
        downloadQuizPdf({
          subject: result.config?.subject || 'Practice Test',
          gradeOrPath,
          questions: result.questions,
          includeAnswers: includeAnswerKey,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('PDF generation timed out (~15s) — please try again.')), 15000)
        ),
      ]);
    } catch (err: any) {
      console.error('Failed to download PDF in PrintableTestModal:', err);
      setPdfError(
        err?.message ||
          (isUrduOrIslamiat
            ? 'پی ڈی ایف ایکسپورٹ دستیاب نہیں ہے — براہ کرم دوبارہ کوشش کریں'
            : 'PDF export unavailable — please try again')
      );
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70  backdrop-blur-md z-50 overflow-y-auto p-4 flex justify-center no-print-bg">
      <div className="bg-white text-slate-900 rounded-2xl max-w-2xl w-full p-8 shadow-2xl my-auto text-sm print:shadow-none print:max-w-none print:w-full print:p-0 print:m-0 printable-paper-root relative overflow-hidden">
        {/* Background Repeating Diagonal Watermark */}
        <PdfWatermarkOverlay />

        {/* Modal Controls (Hidden in Print) */}
        <div className="no-print flex flex-col gap-3 mb-6 pb-4 border-b border-slate-300">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-900 cursor-pointer disabled:opacity-50">
                <input
                  type="checkbox"
                  checked={includeAnswerKey}
                  disabled={isDownloadingPdf}
                  onChange={(e) => setIncludeAnswerKey(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
                />
                <span>{isUrduOrIslamiat ? 'جوابات اور وضاحت شامل کریں' : 'Include Answer Key & Explanations'}</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                className={`font-extrabold text-xs px-4 py-2 rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                  pdfError
                    ? 'bg-rose-700 hover:bg-rose-800 text-white'
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                }`}
              >
                {isDownloadingPdf ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                ) : (
                  <Download className="w-4 h-4 shrink-0" />
                )}
                <span>
                  {isDownloadingPdf
                    ? (isUrduOrIslamiat ? 'تیار ہو رہا ہے...' : 'Generating...')
                    : pdfError
                    ? (isUrduOrIslamiat ? 'دوبارہ کوشش کریں' : 'PDF Failed — Retry')
                    : (isUrduOrIslamiat ? 'پی ڈی ایف ڈاؤن لوڈ' : 'Download PDF')}
                </span>
              </button>

              <button
                onClick={handlePrint}
                disabled={isDownloadingPdf}
                className="bg-[#007AFF] hover:bg-[#0062CC] text-white font-extrabold text-xs px-4 py-2 rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Printer className="w-4 h-4" />
                <span>{isUrduOrIslamiat ? 'پرنٹ کریں' : 'Print'}</span>
              </button>

              <button
                onClick={onClose}
                disabled={isDownloadingPdf}
                className="p-2 text-slate-700 hover:text-slate-900 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* PDF Generation Visual Progress Indicator */}
          {isDownloadingPdf && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 flex flex-col gap-2 transition-all">
              <div className="flex items-center gap-2.5 text-emerald-900 text-xs font-bold">
                <div className="w-4 h-4 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin shrink-0" />
                <span>
                  {isUrduOrIslamiat
                    ? 'پی ڈی ایف ورک شیٹ تیار کی جا رہی ہے... براہ کرم چند لمحے انتظار فرمائیں۔'
                    : 'Generating high-resolution PDF Worksheet... Please wait a moment.'}
                </span>
              </div>
              <div className="w-full bg-emerald-200 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-600 h-full rounded-full animate-pulse w-full" />
              </div>
            </div>
          )}

          {pdfError && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-800 text-xs p-2.5 rounded-xl flex items-center justify-between">
              <span>{pdfError}</span>
              <button onClick={() => setPdfError(null)} className="font-bold underline ml-2 cursor-pointer">Dismiss</button>
            </div>
          )}
        </div>

        {/* PRINTABLE TEST PAPER BODY */}
        <div
          dir={isUrduOrIslamiat ? 'rtl' : 'ltr'}
          className={`print-content relative z-10 space-y-6 ${
            isUrduOrIslamiat ? 'text-right font-["Noto_Nastaliq_Urdu","Noto_Sans_Arabic",serif]' : ''
          }`}
        >
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-[34px] h-[34px] bg-[#0A1330] rounded-lg border border-[#1E5AFF] p-0.5 flex items-center justify-center shrink-0">
                  <img src={activeLogo} alt="Boardly Logo" className="w-full h-full object-contain rounded" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <div className="font-extrabold text-base text-slate-900 tracking-wide uppercase leading-none">
                      BOARDLY
                    </div>
                    <span className="inline-flex items-center justify-center h-[18px] px-2 text-[9.5px] font-extrabold text-[#1E5AFF] bg-blue-50 rounded border border-blue-200 uppercase leading-none">
                      SHS Virtual Academy
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-600 tracking-wide mt-1">
                    {isUrduOrIslamiat ? `امتحانی مشقی پرچہ — ${result.config.subject}` : `Official Practice Paper • ${result.config.subject}`}
                  </p>
                </div>
              </div>
            </div>

            <div className={`grid grid-cols-2 gap-2 text-xs text-slate-700 mt-2 pt-3 border-t border-slate-200 ${isUrduOrIslamiat ? 'text-right' : 'text-left'}`}>
              <div>
                <strong>{isUrduOrIslamiat ? 'طالب علم کا نام:' : 'Student Name:'}</strong> ______________________
              </div>
              <div>
                <strong>{isUrduOrIslamiat ? 'رول نمبر:' : 'Roll / ID No:'}</strong> ______________________
              </div>
              <div>
                <strong>{isUrduOrIslamiat ? 'کلاس / گروہ:' : 'Syllabus Path:'}</strong> Class {result.config.classNum} ({result.config.group})
              </div>
              <div>
                <strong>{isUrduOrIslamiat ? 'کُل وقت:' : 'Time Allowed:'}</strong> {result.config.durationMinutes} {isUrduOrIslamiat ? 'منٹ' : 'Minutes'}
              </div>
            </div>
          </div>

          {/* Question List */}
          <div className="space-y-5">
            {result.questions.map((q, idx) => (
              <div key={q.id || idx} className="space-y-1.5 break-inside-avoid">
                <div className="font-semibold text-slate-900 leading-snug flex items-start gap-1.5">
                  <span className="shrink-0">{isUrduOrIslamiat ? `سوال ${idx + 1}.` : `Q${idx + 1}.`}</span>
                  <MathText text={q.q} isUrduOrIslamiat={isUrduOrIslamiat} />
                </div>
                <div className={`flex flex-wrap justify-between gap-2 ${isUrduOrIslamiat ? 'pr-2' : 'pl-2'} text-xs text-slate-800`}>
                  {q.options.map((opt, oIdx) => (
                    <div key={oIdx} className="w-[48.5%] flex items-start gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-md min-w-0 break-words">
                      <span className="font-bold text-slate-600 shrink-0 whitespace-nowrap">
                        {isUrduOrIslamiat ? urduChoiceLabels[oIdx] : String.fromCharCode(65 + oIdx)}.
                      </span>
                      <div className="flex-1 min-w-0 break-words font-medium">
                        <MathText text={opt} isUrduOrIslamiat={isUrduOrIslamiat} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Optional Answer Key Page */}
          {includeAnswerKey && (
            <div className="mt-12 pt-8 border-t-2 border-dashed border-slate-400 break-before-page space-y-4">
              <div className="text-center pb-2">
                <h2 className="font-serif text-lg font-bold text-slate-900 uppercase">
                  {isUrduOrIslamiat ? 'جوابات اور اہم نکات' : 'Official Answer Key & Explanations'}
                </h2>
                <p className="text-xs text-slate-500">
                  {isUrduOrIslamiat ? 'ایس ایچ ایس ورچوئل اکیڈمی راہنمائی حل' : 'SHS Virtual Academy Guidance Solutions'}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 text-xs">
                {result.questions.map((q, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="font-semibold text-slate-900">
                      {isUrduOrIslamiat
                        ? `سوال ${idx + 1}. صحیح جواب: آپشن (${urduChoiceLabels[q.correct]}) — ${q.options[q.correct]}`
                        : `Q${idx + 1}. Correct Answer: Option ${String.fromCharCode(65 + q.correct)} (${q.options[q.correct]})`}
                    </p>
                    <p className="text-slate-600 mt-1">
                      <strong>{isUrduOrIslamiat ? 'وضاحت:' : 'Explanation:'}</strong> {q.explain}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {restrictionInfo && (
        <PdfRestrictionModal
          reason={restrictionInfo.reason}
          message={restrictionInfo.message}
          remainingMs={restrictionInfo.remainingMs}
          nextAvailableAt={restrictionInfo.nextAvailableAt}
          isProHint={restrictionInfo.isProHint}
          userProfile={restrictionInfo.userProfile}
          onClose={() => setRestrictionInfo(null)}
          onUpgradeClick={onUpgradeClick}
        />
      )}
    </div>
  );
};

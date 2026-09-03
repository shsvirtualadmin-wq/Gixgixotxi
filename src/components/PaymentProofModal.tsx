import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import {
  X,
  CheckCircle2,
  Copy,
  Check,
  CreditCard,
  AlertCircle,
  Loader2,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
  Phone,
  UploadCloud,
  ImageIcon,
  FileText,
  Trash2,
} from 'lucide-react';
import { StudentProfile, User, submitPaymentProofApi, PaymentRequest, supabase } from '../lib/supabase';

interface PaymentProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  studentProfile: StudentProfile | null;
  selectedTrackOverride?: string;
  selectedCycleOverride?: string;
  onSubmitted?: (newRequest: PaymentRequest) => void;
}

export function getMatchingTierFromProfile(
  studentProfile?: StudentProfile | null,
  trackOverride?: string,
  cycleOverride?: string
): { tierId: string; fee: string } {
  let track = (trackOverride || '').toLowerCase();
  const isDaily = (cycleOverride || '').toLowerCase() === 'daily';

  if (!track) {
    const grade = (studentProfile?.grade || studentProfile?.package_name || '').toLowerCase();
    const stream = (studentProfile?.stream || '').toLowerCase();
    const combined = `${grade} ${stream}`;

    if (combined.includes('mdcat')) track = 'mdcat';
    else if (combined.includes('tcat') || combined.includes('ecat')) track = 'tcat';
    else if (combined.includes('9') || combined.includes('10') || combined.includes('matric') || combined.includes('ssc')) track = 'matric';
    else track = 'fsc';
  }

  if (isDaily && (track === 'mdcat' || track === 'tcat' || track === 'ecat')) {
    if (track === 'mdcat') return { tierId: 'MDCAT', fee: '50' };
    return { tierId: 'TCAT / ECAT', fee: '50' };
  }

  if (track === 'mdcat') return { tierId: 'MDCAT', fee: '1499' };
  if (track === 'tcat' || track === 'ecat') return { tierId: 'TCAT / ECAT', fee: '1499' };
  if (track === 'matric') return { tierId: 'Matric', fee: '499' };
  return { tierId: 'FSc', fee: '999' };
}

const PAYMENT_METHODS = [
  {
    id: 'JazzCash',
    name: 'JazzCash',
    number: '+92 305 8969050',
    title: 'Haseena Bibi',
    badge: 'Mobile Wallet',
    color: 'from-[#1E5AFF] to-blue-700',
    border: 'border-[#1E5AFF]/30 ',
    bgLight: 'bg-[#1E5AFF]/5 ',
  },
  {
    id: 'SadaPay',
    name: 'SadaPay',
    number: '+92 349 0744686',
    title: 'Raheela Ferdous',
    badge: 'Digital Bank',
    color: 'from-emerald-500 to-teal-600',
    border: 'border-emerald-500/30 ',
    bgLight: 'bg-emerald-500/5 ',
  },
  {
    id: 'NayaPay',
    name: 'NayaPay',
    number: '+92 349 0744686',
    title: 'Raheela Ferdous',
    badge: 'Digital Bank',
    color: 'from-cyan-500 to-blue-600',
    border: 'border-cyan-500/30 ',
    bgLight: 'bg-cyan-500/5 ',
  },
  {
    id: 'Easypaisa',
    name: 'Easypaisa',
    number: '+92 333 5292094',
    title: 'Sadia Fatima',
    badge: 'Mobile Wallet',
    color: 'from-green-500 to-emerald-700',
    border: 'border-green-500/30 ',
    bgLight: 'bg-green-500/5 ',
  },
];

const PRICING_TIERS = [
  { id: 'Matric', title: 'Matric', subtitle: '9th & 10th Class', fee: '499', label: 'Matric (9th/10th)', desc: 'Full MCQ Bank & Past Papers' },
  { id: 'FSc', title: 'FSc', subtitle: '1st & 2nd Year', fee: '999', label: 'FSc (1st/2nd Year)', desc: 'Pre-Med & Engineering' },
  { id: 'MDCAT', title: 'MDCAT', subtitle: 'Medical Entry Test', fee: '1499', label: 'MDCAT Prep', desc: 'Complete MDCAT Prep' },
  { id: 'TCAT / ECAT', title: 'TCAT / ECAT', subtitle: 'Engineering Entry Test', fee: '1499', label: 'TCAT / ECAT', desc: 'ECAT Prep & Mocks' },
];

export const PaymentProofModal: React.FC<PaymentProofModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  studentProfile,
  selectedTrackOverride,
  selectedCycleOverride,
  onSubmitted,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string>('JazzCash');
  
  const initialMatching = getMatchingTierFromProfile(studentProfile, selectedTrackOverride, selectedCycleOverride);
  const [selectedTier, setSelectedTier] = useState<string>(initialMatching.tierId);
  const [amount, setAmount] = useState<string>(initialMatching.fee);

  React.useEffect(() => {
    if (isOpen) {
      const matching = getMatchingTierFromProfile(studentProfile, selectedTrackOverride, selectedCycleOverride);
      setSelectedTier(matching.tierId);
      setAmount(matching.fee);
    }
  }, [isOpen, studentProfile?.grade, studentProfile?.stream, studentProfile?.package_name, selectedTrackOverride, selectedCycleOverride]);

  const [fullName, setFullName] = useState<string>(() => {
    return studentProfile?.name || currentUser?.user_metadata?.full_name || '';
  });

  const [studentEmail, setStudentEmail] = useState<string>(() => {
    return currentUser?.email || studentProfile?.email || '';
  });

  const [paidFromPhone, setPaidFromPhone] = useState<string>(() => {
    return studentProfile?.phone || '';
  });

  const [transactionRef, setTransactionRef] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [whatsappUrl, setWhatsappUrl] = useState<string>('');

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      return;
    }

    // Validation (max 15MB)
    if (file.size > 15 * 1024 * 1024) {
      setError('File size limit exceeded: Maximum allowed size is 15MB.');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|gif|pdf)$/i)) {
      setError('Invalid file type. Please upload a PNG, JPG, WEBP screenshot or PDF document.');
      return;
    }

    setError(null);
    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const [hasConfirmedSubmittedProof, setHasConfirmedSubmittedProof] = useState<boolean>(false);
  const [isConfirmingSubmission, setIsConfirmingSubmission] = useState<boolean>(false);
  const [confirmSubmissionError, setConfirmSubmissionError] = useState<string | null>(null);

  const handleConfirmSubmittedProof = async () => {
    if (hasConfirmedSubmittedProof || isConfirmingSubmission) {
      console.log('[PaymentProofModal] Already confirmed or confirming, skipping duplicate execution.');
      return;
    }
    console.log('[PaymentProofModal] "I\'ve submitted my payment proof" button clicked! Calling submitPaymentProofApi -> /api/payment-requests/submit');
    setIsConfirmingSubmission(true);
    setConfirmSubmissionError(null);
    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append('file', selectedFile);
      }
      formData.append('student_id', currentUser?.id || studentProfile?.id || `anon-${Date.now()}`);
      formData.append('student_name', fullName.trim() || currentUser?.user_metadata?.full_name || 'Student');
      formData.append('student_email', studentEmail.trim() || currentUser?.email || studentProfile?.email || '');
      formData.append('payment_method', selectedMethod);
      formData.append('amount', amount);
      formData.append('transaction_reference', transactionRef.trim());
      formData.append('course_tier', selectedTier);
      formData.append('tier', selectedTier);

      console.log('[PaymentProofModal] Submitting payment proof formData');
      const res = await submitPaymentProofApi(formData);
      console.log('[PaymentProofModal] submitPaymentProofApi response:', res);

      if (res.success) {
        console.log('[PaymentProofModal] Payment proof successfully recorded in backend/Supabase');
        setHasConfirmedSubmittedProof(true);
      } else {
        console.error('[PaymentProofModal] Payment proof submission failed:', res.error);
        setConfirmSubmissionError(res.error || 'Failed to log payment proof. Please try again.');
      }
    } catch (err: any) {
      console.error('[PaymentProofModal] Exception in handleConfirmSubmittedProof:', err);
      setConfirmSubmissionError(err?.message || 'An unexpected error occurred.');
    } finally {
      setIsConfirmingSubmission(false);
    }
  };

  const hasKnownTrack = Boolean(studentProfile?.grade || studentProfile?.stream || studentProfile?.package_name || selectedTrackOverride);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSelectTier = (tierId: string, fee: string) => {
    setSelectedTier(tierId);
    setAmount(fee);
    setError(null);
  };

  const generateWhatsappMessage = (name: string, email: string, method: string, phoneFrom: string, amt: string, tier: string, trx: string) => {
    const text =
`Hi, I have sent payment for Boardly Premium verification.

*Student Name:* ${name.trim()}
*Email:* ${email.trim()}
*Plan Selected:* ${tier}
*Account Paid To:* ${method}
*Paid From Phone:* ${phoneFrom.trim()}
*Amount Paid:* PKR ${amt.trim()}
*Transaction ID:* ${trx.trim()}

Please verify my payment and activate my account.`;
    return `https://wa.me/923222314436?text=${encodeURIComponent(text)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const nameVal = fullName.trim() || studentProfile?.name || currentUser?.user_metadata?.full_name || 'Student';
    const resolvedEmail = (studentEmail || currentUser?.email || studentProfile?.email || '').trim();
    const phoneVal = paidFromPhone.trim();
    const trxVal = transactionRef.trim();

    if (!nameVal) {
      setError('Please enter your full name.');
      return;
    }

    if (!resolvedEmail || !/\S+@\S+\.\S+/.test(resolvedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!phoneVal) {
      setError('Please enter the phone number you paid FROM.');
      return;
    }

    if (!trxVal) {
      setError('Please enter your Transaction ID / Reference Number.');
      return;
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Please enter a valid payment amount.');
      return;
    }

    const studentId = currentUser?.id || studentProfile?.id || `anon-${Date.now()}`;
    setIsSubmitting(true);

    try {
      if (currentUser?.id) {
        try {
          await supabase
            .from('students')
            .update({
              payment_status: 'Pending Verification',
              plan_status: 'pending_verification',
              updated_at: new Date().toISOString()
            })
            .eq('id', currentUser.id);
        } catch (dbErr) {
          console.warn('[PaymentProofModal] Supabase student update notice:', dbErr);
        }
      }

      const isDailyPlan = amount === '50' || selectedCycleOverride === 'daily';
      const tierName = isDailyPlan ? `${selectedTier} (Daily Access)` : selectedTier;
      const packageName = isDailyPlan ? `${selectedTier} Daily Pro` : `${selectedTier} Pro`;

      const formData = new FormData();
      if (selectedFile) {
        formData.append('file', selectedFile);
      }
      formData.append('student_id', studentId);
      formData.append('student_name', nameVal);
      formData.append('student_email', resolvedEmail);
      formData.append('payment_method', selectedMethod);
      formData.append('paid_from_phone', phoneVal);
      formData.append('amount', amount);
      formData.append('course_tier', tierName);
      formData.append('tier', tierName);
      formData.append('package_name', packageName);
      formData.append('transaction_reference', trxVal);

      const res = await submitPaymentProofApi(formData);

      const waUrl = generateWhatsappMessage(nameVal, resolvedEmail, selectedMethod, phoneVal, amount, tierName, trxVal);
      setWhatsappUrl(waUrl);

      // Open WhatsApp chat in a new tab immediately
      try {
        window.open(waUrl, '_blank');
      } catch (openErr) {
        console.warn('Could not auto-open WhatsApp link:', openErr);
      }

      setIsSuccess(true);
      if (onSubmitted) {
        onSubmitted(res.data || ({
          student_id: studentId,
          student_name: nameVal,
          student_email: resolvedEmail,
          payment_method: selectedMethod,
          paid_from_phone: phoneVal,
          amount: amount,
          course_tier: tierName,
          transaction_reference: trxVal,
        } as any));
      }
    } catch (err: any) {
      console.error('[PaymentProofModal] Submission error:', err);
      setError(err?.message || 'Error processing payment verification request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-2xl my-8 bg-white  border border-slate-200  rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/15 rounded-2xl backdrop-blur-md">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">WhatsApp Payment Verification</h2>
              <p className="text-xs text-emerald-100/90 font-medium mt-0.5">
                Submit payment details & verify instantly with official WhatsApp support (+923222314436)
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Banner */}
              {error && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600  text-xs flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="font-semibold">{error}</div>
                </div>
              )}

              {/* 1. Pricing Tier Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 ">
                    {hasKnownTrack ? 'Selected Plan / Tier' : '1. Select Plan / Tier'}
                  </label>
                  {hasKnownTrack && (
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#1E5AFF] text-white">
                      Enrolled Track
                    </span>
                  )}
                </div>

                {hasKnownTrack ? (
                  <div className="p-3.5 rounded-2xl border bg-emerald-500/10  border-emerald-500 text-emerald-900  ring-2 ring-emerald-500/30 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-bold text-slate-500 ">
                        {PRICING_TIERS.find((t) => t.id === selectedTier)?.subtitle || 'Selected Plan'}
                      </div>
                      <div className="text-sm font-black text-slate-900  mt-0.5">
                        {PRICING_TIERS.find((t) => t.id === selectedTier)?.title || selectedTier}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-emerald-600  block">
                        PKR {amount} {amount === '50' || selectedCycleOverride === 'daily' ? '/ day' : ''}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 ">
                        Auto-selected for your track
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {PRICING_TIERS.map((tier) => {
                      const isSelected = selectedTier === tier.id;
                      return (
                        <button
                          key={tier.id}
                          type="button"
                          onClick={() => handleSelectTier(tier.id, tier.fee)}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
                            isSelected
                              ? 'bg-emerald-500/10  border-emerald-500 text-emerald-900  ring-2 ring-emerald-500/30'
                              : 'bg-slate-50  border-slate-200  text-slate-700  hover:border-slate-300 '
                          }`}
                        >
                          <div className="text-[11px] font-bold text-slate-500 ">{tier.subtitle}</div>
                          <div className="text-sm font-black text-slate-900  mt-0.5">{tier.title}</div>
                          <div className="text-xs font-black text-emerald-600  mt-1">
                            PKR {tier.fee}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2. Official Payment Accounts */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 ">
                    2. Official Accounts — Send Payment Here
                  </label>
                  <span className="text-[10px] font-bold text-emerald-600  bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    Amount: PKR {amount}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PAYMENT_METHODS.map((method) => {
                    const isSelected = selectedMethod === method.id;
                    return (
                      <div
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                          isSelected
                            ? `${method.bgLight} ${method.border} ring-2 ring-emerald-500/30`
                            : 'bg-slate-50  border-slate-200  hover:border-slate-300 '
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-black text-slate-900  flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                            {method.name}
                          </span>
                          <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-200/70  text-slate-600 ">
                            {method.badge}
                          </span>
                        </div>

                        <div className="text-xs font-mono font-bold text-slate-800  flex items-center justify-between">
                          <span>{method.number}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(method.number.replace(/\s+/g, ''), method.id);
                            }}
                            className="p-1 rounded-md bg-slate-200/60  hover:bg-emerald-500 hover:text-white transition-colors cursor-pointer text-slate-600 "
                            title="Copy Account Number"
                          >
                            {copiedId === method.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-500  font-medium mt-1">
                          Account Title: <strong className="text-slate-700  font-bold">{method.title}</strong>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Verification Details Form */}
              <div className="space-y-4 pt-2 border-t border-slate-100 ">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500  block">
                  3. Your Payment Details
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700  mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Muhammad Ali"
                      className="w-full bg-slate-50  border border-slate-300  focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-slate-900  outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700  mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      placeholder="student@example.com"
                      className="w-full bg-slate-50  border border-slate-300  focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-slate-900  outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700  mb-1">
                      Phone Number Paid FROM <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={paidFromPhone}
                      onChange={(e) => setPaidFromPhone(e.target.value)}
                      placeholder="e.g. 03001234567"
                      className="w-full bg-slate-50  border border-slate-300  focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-slate-900  outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700  mb-1">
                      Transaction ID / Reference Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      placeholder="e.g. TRX12345678"
                      className="w-full bg-slate-50  border border-slate-300  focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-slate-900  outline-none font-mono"
                    />
                  </div>
                </div>

                {/* 4. Payment Screenshot / Proof File Upload */}
                <div className="pt-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Payment Screenshot / Receipt (Recommended)</span>
                    <span className="text-[10px] text-slate-400 font-normal">PNG, JPG, WEBP, PDF (Max 15MB)</span>
                  </label>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,application/pdf"
                    className="hidden"
                  />

                  {!selectedFile ? (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                        isDragging
                          ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]'
                          : 'border-slate-300 hover:border-emerald-500/60 bg-slate-50 hover:bg-slate-100/80'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-800">
                          Click to browse or drag & drop payment screenshot
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Attach your transaction confirmation or bank receipt
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-emerald-500/40 bg-emerald-500/[0.04] rounded-2xl p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {previewUrl ? (
                          <img
                            src={previewUrl}
                            alt="Payment screenshot preview"
                            className="w-12 h-12 object-cover rounded-xl border border-slate-200 shadow-sm shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 shrink-0">
                            <FileText className="w-6 h-6" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {selectedFile.name}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'Document'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:text-emerald-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFileChange(null)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 bg-white border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Remove attached file"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Notice */}
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-xs space-y-1.5 text-emerald-800 ">
                <div className="font-extrabold flex items-center gap-1.5 text-emerald-700 ">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Official WhatsApp Verification Channel: +923222314436</span>
                </div>
                <p className="text-[11px] text-slate-600  leading-relaxed">
                  Tapping the button below records your submission in our database and opens WhatsApp with your payment details pre-filled. You can attach your payment screenshot directly in WhatsApp.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#25D366] hover:bg-[#1eae50] text-white font-black py-3.5 px-6 rounded-full transition-all cursor-pointer text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Opening WhatsApp Chat...</span>
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    <span>Verify Payment on WhatsApp (+923222314436)</span>
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Success View */
            <div className="text-center py-6 space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-700  border border-emerald-500/20">
                  Submission Saved
                </span>
                <h3 className="text-2xl font-black text-slate-900 ">
                  Payment Verification Request Sent!
                </h3>
                <p className="text-xs text-slate-600  max-w-md mx-auto leading-relaxed">
                  Your payment details for <strong>{selectedTier}</strong> (Ref: <span className="font-mono font-bold text-emerald-600 ">{transactionRef}</span>) have been logged.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50  border border-slate-200  text-left text-xs space-y-1.5">
                <div className="font-extrabold text-slate-800 ">
                  Verification Summary:
                </div>
                <div className="text-slate-600  space-y-1 text-[11px]">
                  <div>• Student: <strong>{fullName}</strong> ({studentEmail})</div>
                  <div>• Account Paid To: <strong>{selectedMethod}</strong></div>
                  <div>• Sender Phone: <strong>{paidFromPhone}</strong></div>
                  <div>• Amount Paid: <strong>PKR {amount}</strong></div>
                  <div>• WhatsApp Contact: <strong>+923222314436</strong></div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <a
                  href={whatsappUrl || generateWhatsappMessage(fullName, studentEmail, selectedMethod, paidFromPhone, amount, selectedTier, transactionRef)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-[#25D366] hover:bg-[#1eae50] text-white font-black py-3.5 px-6 rounded-full text-xs sm:text-sm transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Open WhatsApp Chat (+923222314436)</span>
                </a>

                {confirmSubmissionError && (
                  <p className="text-[11px] text-red-500 font-semibold text-center bg-red-50  p-2 rounded-xl border border-red-200 ">
                    {confirmSubmissionError}
                  </p>
                )}
                {!hasConfirmedSubmittedProof ? (
                  <button
                    type="button"
                    disabled={isConfirmingSubmission}
                    onClick={handleConfirmSubmittedProof}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 px-6 rounded-full text-xs sm:text-sm transition-all cursor-pointer shadow-xl flex items-center justify-center gap-2 border-2 border-emerald-400"
                  >
                    {isConfirmingSubmission ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Logging Payment Request...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                        <span>I've submitted my payment proof</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-xs font-extrabold text-emerald-700  flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Submission Logged & Confirmed for Admin Verification</span>
                  </div>
                )}

                <button
                  type="button"
                  disabled={!hasConfirmedSubmittedProof}
                  onClick={onClose}
                  className={`w-full font-bold text-xs py-3 px-4 rounded-full transition-all ${
                    hasConfirmedSubmittedProof
                      ? 'bg-slate-100  hover:bg-slate-200  text-slate-800  cursor-pointer'
                      : 'bg-slate-200  text-slate-400  cursor-not-allowed opacity-50'
                  }`}
                >
                  Close Window
                </button>
                {!hasConfirmedSubmittedProof && (
                  <p className="text-[10px] text-[#1E5AFF]  font-bold text-center">
                    Please tap "I've submitted my payment proof" above to enable closing.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
